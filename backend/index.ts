import { readdir, stat, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import chardet from "chardet";
import iconv from "iconv-lite";

const execAsync = promisify(exec);

// プロジェクトのルートディレクトリの制限を撤廃し、OS全体を対象にする
// Windows の場合は 'C:\\'、Posix の場合は '/' をデフォルトにする
const OS_ROOT = process.platform === "win32" ? "C:\\" : "/";

// 初期表示ディレクトリ
const INITIAL_DIR = OS_ROOT;

// レジストリ保存先
const REGISTRY_DIR = path.resolve(process.cwd(), "registry");

// システムパスの取得
const USER_PATHS = {
  os_root: OS_ROOT,
  homedir: os.homedir(),
  desktop: path.join(os.homedir(), "Desktop"),
  documents: path.join(os.homedir(), "Documents"),
  downloads: path.join(os.homedir(), "Downloads"),
};

// Windows ショートカット (.lnk) のターゲットを解決する
async function resolveLnk(lnkPath: string): Promise<string> {
  if (process.platform !== "win32") return lnkPath;
  try {
    // 常にバックスラッシュに統一し、エスケープを考慮
    const normalizedPath = lnkPath.replace(/\//g, "\\");
    const script = `
      $sh = New-Object -ComObject WScript.Shell
      $target = $sh.CreateShortcut('${normalizedPath}').TargetPath
      $target
    `;
    const { stdout } = await execAsync(`powershell -Command "${script.replace(/\n/g, '')}"`);
    const resolved = stdout.trim();
    console.log(`LNK Resolve: ${lnkPath} -> ${resolved}`);
    return resolved || lnkPath;
  } catch (e) {
    console.error("LNK resolution failed:", e);
    return lnkPath;
  }
}

// OS の論理ドライブを取得する
async function getDrives(): Promise<string[]> {
  if (process.platform === "win32") {
    try {
      const { stdout } = await execAsync("wmic logicaldisk get name");
      return stdout.split(/\r?\n/).filter(line => /[A-Z]:/.test(line)).map(line => line.trim() + "\\");
    } catch {
      return ["C:\\"];
    }
  }
  return ["/"];
}

// アプリケーション定義
const APPS_REGISTRY = {
  explorer: {
    id: "explorer",
    name: "File Explorer",
    icon: "📁",
    showInContext: false,
    pinned: true,
  },
  editor: {
    id: "editor",
    name: "Simple Editor",
    icon: "📝",
    showInContext: true,
    pinned: false,
    supportedExtensions: [
      ".txt", ".md", ".ts", ".js", ".json", ".css", ".html", ".htm", 
      ".py", ".c", ".cpp", ".h", ".hpp", ".rs", ".go", ".sh", ".bat", 
      ".torrent", ".yaml", ".yml", ".ini", ".conf", ""
    ],
  },
  hex: {
    id: "hex",
    name: "Hex Editor",
    icon: "🔢",
    showInContext: true,
    pinned: false,
    supportedExtensions: ["*"], // 全ファイル対応
  },
  image: {
    id: "image",
    name: "Image Viewer",
    icon: "🖼️",
    showInContext: true,
    pinned: false,
    supportedExtensions: [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp"],
  },
  video: {
    id: "video",
    name: "Video Player",
    icon: "🎬",
    showInContext: true,
    pinned: false,
    supportedExtensions: [".mp4", ".webm", ".ogg"],
  },
  calc: {
    id: "calc",
    name: "Calculator",
    icon: "🧮",
    showInContext: false,
    pinned: true,
  },
  paint: {
    id: "paint",
    name: "Paint App",
    icon: "🎨",
    showInContext: false,
    pinned: true,
  },
  "image-editor": {
    id: "image-editor",
    name: "Image Editor",
    icon: "🖌️",
    showInContext: false,
    pinned: false,
  },
  browser: {
    id: "browser",
    name: "Browser",
    icon: "🌐",
    showInContext: true,
    pinned: true,
  },
  taskmanager: {
    id: "taskmanager",
    name: "Task Manager",
    icon: "📊",
    showInContext: false,
    pinned: true,
  },
  sysinfo: {
    id: "sysinfo",
    name: "System Info",
    icon: "ℹ️",
    showInContext: false,
    pinned: false,
  },
  terminal: {
    id: "terminal",
    name: "Terminal",
    icon: "💻",
    showInContext: false,
    pinned: true,
  },
  settings: {
    id: "settings",
    name: "Settings",
    icon: "⚙️",
    showInContext: false,
    pinned: true,
  },
  stickynotes: {
    id: "stickynotes",
    name: "Sticky Notes",
    icon: "📝",
    showInContext: false,
    pinned: false,
  },
  minesweeper: {
    id: "minesweeper",
    name: "Minesweeper",
    icon: "💣",
    showInContext: false,
    pinned: false,
  },
};

// const DIST_DIR = path.resolve(process.cwd(), "..", "frontend", "dist"); // 埋め込みアセットを使用するため不要

import { EMBEDDED_ASSETS } from "./embeddedAssets";

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    
    // CORS ヘッダー
    const resHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { headers: resHeaders });
    }

    // パス安全性チェックヘルパー (制限を撤廃)
    const getSafePath = (queryPath: string | null) => {
      if (!queryPath || queryPath === "." || queryPath === "") return INITIAL_DIR;
      return path.resolve(queryPath);
    };

    // --- API ルート ---
    if (url.pathname.startsWith("/api/")) {
      // 1. アプリ設定の取得
      if (url.pathname === "/api/apps") {
        return Response.json(APPS_REGISTRY, { headers: resHeaders });
      }

      // クイックアクセス用パスの取得
      if (url.pathname === "/api/user-paths") {
        return Response.json(USER_PATHS, { headers: resHeaders });
      }

      // システムドライブの一覧取得
      if (url.pathname === "/api/system/drives") {
        const drives = await getDrives();
        return Response.json(drives, { headers: resHeaders });
      }

      // LNK ターゲットの解決
      if (url.pathname === "/api/lnk/resolve") {
        const lnkPath = url.searchParams.get("path");
        if (!lnkPath) return Response.json({ error: "Path is required" }, { status: 400, headers: resHeaders });
        const target = await resolveLnk(lnkPath);
        return Response.json({ target }, { headers: resHeaders });
      }

      // アプリ設定（レジストリ）の管理
      if (url.pathname.startsWith("/api/settings/")) {
        const appId = url.pathname.split("/").pop();
        if (!appId) return Response.json({ error: "App ID required" }, { status: 400, headers: resHeaders });
        const settingsPath = path.join(REGISTRY_DIR, `${appId}.json`);

        if (req.method === "GET") {
          try {
            const content = await readFile(settingsPath, "utf-8");
            return Response.json(JSON.parse(content), { headers: resHeaders });
          } catch {
            return Response.json({}, { headers: resHeaders });
          }
        }
        
        if (req.method === "POST") {
          try {
            const body = await req.json();
            await mkdir(REGISTRY_DIR, { recursive: true });
            await writeFile(settingsPath, JSON.stringify(body, null, 2), "utf-8");
            return Response.json({ success: true }, { headers: resHeaders });
          } catch (error: any) {
            return Response.json({ error: error.message }, { status: 500, headers: resHeaders });
          }
        }
      }

      // 2. ディレクトリ一覧の取得
      if (url.pathname === "/api/files") {
        try {
          const targetPath = getSafePath(url.searchParams.get("path"));
          const entries = await readdir(targetPath, { withFileTypes: true });
          
          const files = await Promise.all(
            entries.map(async (entry) => {
              const entryPath = path.join(targetPath, entry.name);
              try {
                const stats = await stat(entryPath);
                let isDirectory = entry.isDirectory();
                let lnkTarget = null;
                const extension = path.extname(entry.name).toLowerCase();

                if (extension === ".lnk" && process.platform === "win32") {
                  lnkTarget = await resolveLnk(entryPath);
                  if (lnkTarget) {
                    try {
                      const tStats = await stat(lnkTarget);
                      if (tStats.isDirectory()) isDirectory = true;
                    } catch {}
                  }
                }

                return {
                  name: entry.name,
                  isDirectory,
                  isLnk: !!lnkTarget,
                  lnkTarget,
                  size: stats.size,
                  mtime: stats.mtime,
                  extension,
                };
              } catch {
                return { name: entry.name, isDirectory: entry.isDirectory(), error: "Stat failed" };
              }
            })
          );

          return Response.json({ currentPath: targetPath, files }, { headers: resHeaders });
        } catch (error: any) {
          return Response.json({ error: error.message }, { status: 403, headers: resHeaders });
        }
      }

      // 3. ファイル内容の読み込み
      if (url.pathname === "/api/file/read") {
        try {
          const targetPath = getSafePath(url.searchParams.get("path"));
          const encodingParam = url.searchParams.get("encoding");
          const buffer = await readFile(targetPath);

          if (encodingParam === "hex") {
            const hex = Buffer.from(buffer).toString("hex");
            return new Response(hex, { headers: resHeaders });
          }

          const detected = chardet.detect(buffer) || "utf-8";
          const finalEncoding = encodingParam || detected;
          const content = iconv.decode(buffer, finalEncoding);

          return new Response(content, { 
            headers: { 
              ...resHeaders, 
              "Content-Type": "text/plain; charset=utf-8",
              "X-Detected-Encoding": detected 
            } 
          });
        } catch (error: any) {
          return Response.json({ error: error.message }, { status: 500, headers: resHeaders });
        }
      }

      // 4. メディアファイルの配信
      if (url.pathname === "/api/media") {
        try {
          const targetPath = getSafePath(url.searchParams.get("path"));
          const file = Bun.file(targetPath);
          return new Response(file, { headers: resHeaders });
        } catch (error: any) {
          return Response.json({ error: error.message }, { status: 500, headers: resHeaders });
        }
      }

      // 5. ファイルの保存
      if (url.pathname === "/api/file/write" && req.method === "POST") {
        try {
          const targetPath = getSafePath(url.searchParams.get("path"));
          const body = (await req.json()) as { content: string };
          await writeFile(targetPath, body.content, "utf-8");
          return Response.json({ success: true }, { headers: resHeaders });
        } catch (error: any) {
          return Response.json({ error: error.message }, { status: 500, headers: resHeaders });
        }
      }

      // 6. 高度な検索
      if (url.pathname === "/api/search") {
        try {
          const query = url.searchParams.get("q") || "";
          const searchPath = getSafePath(url.searchParams.get("path"));
          
          let filter: 'file' | 'folder' | 'app' | 'ext' | 'all' = 'all';
          let searchTerm = query;
          let ext = "";

          if (query.startsWith("file:")) {
            filter = 'file';
            searchTerm = query.slice(5).trim();
          } else if (query.startsWith("folder:")) {
            filter = 'folder';
            searchTerm = query.slice(7).trim();
          } else if (query.startsWith("app:")) {
            filter = 'app';
            searchTerm = query.slice(4).trim();
          } else if (query.startsWith(".")) {
            filter = 'ext';
            ext = query.toLowerCase();
            searchTerm = "";
          }

          const results: any[] = [];
          if (filter === 'all' || filter === 'app') {
            Object.values(APPS_REGISTRY).forEach(app => {
              if (app.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                results.push({ type: 'app', ...app });
              }
            });
          }

          if (filter !== 'app') {
            const entries = await readdir(searchPath, { withFileTypes: true });
            for (const entry of entries) {
              const isDir = entry.isDirectory();
              const extension = path.extname(entry.name).toLowerCase();
              const nameMatch = entry.name.toLowerCase().includes(searchTerm.toLowerCase());

              if (filter === 'file' && !isDir && nameMatch) results.push({ type: 'file', name: entry.name, path: path.join(searchPath, entry.name) });
              else if (filter === 'folder' && isDir && nameMatch) results.push({ type: 'folder', name: entry.name, path: path.join(searchPath, entry.name) });
              else if (filter === 'ext' && extension === ext) results.push({ type: 'file', name: entry.name, path: path.join(searchPath, entry.name) });
              else if (filter === 'all' && nameMatch) {
                results.push({ type: isDir ? 'folder' : 'file', name: entry.name, path: path.join(searchPath, entry.name) });
              }
            }
          }

          return Response.json(results, { headers: resHeaders });
        } catch (error: any) {
          return Response.json({ error: error.message }, { status: 500, headers: resHeaders });
        }
      }

      // システム統計情報
      if (url.pathname === "/api/stats") {
        const stats = {
          cpu: {
            model: os.cpus().length > 0 ? os.cpus()[0].model : "Unknown CPU",
            cores: os.cpus().length,
            load: os.loadavg(),
            times: os.cpus().map(c => c.times),
          },
          memory: {
            total: os.totalmem(),
            free: os.freemem(),
            used: os.totalmem() - os.freemem(),
            percentage: (((os.totalmem() - os.freemem()) / os.totalmem()) * 100).toFixed(2),
          },
          system: {
            platform: os.platform(),
            arch: os.arch(),
            release: os.release(),
            uptime: os.uptime(),
            hostname: os.hostname(),
          }
        };
        return Response.json(stats, { headers: resHeaders });
      }

      // ターミナルコマンド実行
      if (url.pathname === "/api/terminal" && req.method === "POST") {
        try {
          const { command, cwd } = (await req.json()) as any;
          const { stdout, stderr } = await execAsync(command, { cwd: cwd || OS_ROOT });
          return Response.json({ stdout, stderr }, { headers: resHeaders });
        } catch (error: any) {
          return Response.json({ 
            stdout: error.stdout || "", 
            stderr: error.stderr || error.message 
          }, { status: 200, headers: resHeaders });
        }
      }

      if (url.pathname === "/api/status") {
        return new Response("OK", { headers: resHeaders });
      }

      return new Response("Not Found", { status: 404, headers: resHeaders });
    }

    // --- 埋め込み資産の配信 (Single EXE 対応) ---
    const pathKey = url.pathname === "/" ? "/index.html" : url.pathname;
    const asset = EMBEDDED_ASSETS[pathKey];

    if (asset) {
      const binary = Buffer.from(asset.content, "base64");
      return new Response(binary, {
        headers: { "Content-Type": asset.mime }
      });
    }

    // クライアントサイドルーティング対応 (見つからない場合は index.html を返す)
    const indexAsset = EMBEDDED_ASSETS["/index.html"];
    if (indexAsset) {
      return new Response(Buffer.from(indexAsset.content, "base64"), {
        headers: { "Content-Type": indexAsset.mime }
      });
    }

    return new Response("Not Found", { status: 404, headers: resHeaders });
  },
});

console.log(`Server running at ${server.url}`);

// サーバー起動時にブラウザを自動で開く
const openBrowser = async () => {
  const url = `http://localhost:${server.port}`;
  console.log(`Opening browser to ${url}...`);
  try {
    if (process.platform === "win32") {
      await execAsync(`start ${url}`);
    } else if (process.platform === "darwin") {
      await execAsync(`open ${url}`);
    } else {
      await execAsync(`xdg-open ${url}`);
    }
  } catch (e) {
    console.error("Failed to open browser automatically:", e);
  }
};

openBrowser();

