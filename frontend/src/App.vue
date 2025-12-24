<script setup lang="ts">
/**
 * App.vue
 * デスクトップ全体のレイアウトと複数のウィンドウ管理（移動・リサイズ）を担当。
 */
import { ref, onMounted } from 'vue';
import FileExplorer from './views/FileExplorer.vue';
import SimpleEditor from './views/SimpleEditor.vue';
import HexEditor from './views/HexEditor.vue';
import Calculator from './views/Calculator.vue';
import PaintApp from './views/PaintApp.vue';
import ImageViewer from './views/ImageViewer.vue';
import ImageEditor from './views/ImageEditor.vue';
import VideoPlayer from './views/VideoPlayer.vue';
import ContextMenu from './components/ContextMenu.vue';
import { fetchApps, apps } from './appRegistry';
import StartMenu from './components/StartMenu.vue';
import Browser from './views/Browser.vue';
import TaskManager from './views/TaskManager.vue';
import SystemInfo from './views/SystemInfo.vue';
import Terminal from './views/Terminal.vue';
import ControlCenter from './components/ControlCenter.vue';
import Minesweeper from './views/Minesweeper.vue';
import StickyNotes from './views/StickyNotes.vue';

// ウィンドウの管理状態
interface WindowState {
  id: string;
  appId: string;
  title: string;
  path?: string;
  zIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

const openWindows = ref<WindowState[]>([]);
const topZIndex = ref(100);

// OSメニュー管理
const isStartMenuOpen = ref(false);
const isControlCenterOpen = ref(false);
const toggleStartMenu = () => {
  isStartMenuOpen.value = !isStartMenuOpen.value;
  if (isStartMenuOpen.value) isControlCenterOpen.value = false;
};
const toggleControlCenter = () => {
  isControlCenterOpen.value = !isControlCenterOpen.value;
  if (isControlCenterOpen.value) isStartMenuOpen.value = false;
};

const handleStartNavigate = (path: string) => {
  // Explorerを開いて、そのパスへ遷移させる
  const explorer = openWindows.value.find(w => w.appId === 'explorer');
  if (explorer) {
    explorer.path = path;
    focusWindow(explorer.id);
  } else {
    launchApp('explorer', path);
  }
};

// グローバルコンテキストメニュー
const globalContextMenu = ref<{ x: number, y: number, file: any } | null>(null);

const handleGlobalContextMenu = (payload: { x: number, y: number, file: any }) => {
  globalContextMenu.value = payload;
};

// デスクトップファイル管理
const desktopFiles = ref<any[]>([]);
const fetchDesktopFiles = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/files?path=Desktop');
    if (res.ok) {
      desktopFiles.value = await res.json();
    }
  } catch (err) {
    console.error('Failed to fetch desktop files:', err);
  }
};

// アプリケーションを起動する
const launchApp = (appId: string, path?: string) => {
  const appConfig = apps.value[appId];
  if (!appConfig) return;

  // 初期位置とサイズ（横長に調整）
  const defaultWidth = 850;
  const defaultHeight = 550;
  const offset = openWindows.value.length * 30; // 起動するたびに少しずらす

  const newWindow: WindowState = {
    id: `${appId}-${Date.now()}`,
    appId,
    title: path ? `${appConfig.name} - ${path.split('/').pop()}` : appConfig.name,
    path,
    zIndex: ++topZIndex.value,
    x: 100 + offset,
    y: 80 + offset,
    width: defaultWidth,
    height: defaultHeight,
  };
  
  openWindows.value.push(newWindow);
};

// ウィンドウを閉じる
const closeWindow = (id: string) => {
  openWindows.value = openWindows.value.filter(w => w.id !== id);
};

// ウィンドウを前面に持ってくる
const focusWindow = (id: string) => {
  const win = openWindows.value.find(w => w.id === id);
  if (win && win.zIndex < topZIndex.value) {
    win.zIndex = ++topZIndex.value;
  }
};

// --- ドラッグ & リサイズロジック ---
const activeAction = ref<{ id: string, type: 'move' | 'resize', startX: number, startY: number, startW: number, startH: number, startPosX: number, startPosY: number } | null>(null);

const startMove = (e: MouseEvent, win: WindowState) => {
  focusWindow(win.id);
  activeAction.value = { 
    id: win.id, type: 'move', 
    startX: e.clientX, startY: e.clientY, 
    startW: win.width, startH: win.height, 
    startPosX: win.x, startPosY: win.y 
  };
  e.preventDefault();
};

const startResize = (e: MouseEvent, win: WindowState) => {
  focusWindow(win.id);
  activeAction.value = { 
    id: win.id, type: 'resize', 
    startX: e.clientX, startY: e.clientY, 
    startW: win.width, startH: win.height, 
    startPosX: win.x, startPosY: win.y 
  };
  e.preventDefault();
  e.stopPropagation();
};

const handleMouseMove = (e: MouseEvent) => {
  if (!activeAction.value) return;
  const action = activeAction.value;
  const win = openWindows.value.find(w => w.id === action.id);
  if (!win) return;

  const dx = e.clientX - action.startX;
  const dy = e.clientY - action.startY;

  if (action.type === 'move') {
    win.x = action.startPosX + dx;
    win.y = action.startPosY + dy;
  } else if (action.type === 'resize') {
    // 最小サイズの制限
    win.width = Math.max(400, action.startW + dx);
    win.height = Math.max(300, action.startH + dy);
  }
};

const handleMouseUp = (e: MouseEvent) => {
  if (activeAction.value && activeAction.value.type === 'move') {
    const action = activeAction.value;
    const win = openWindows.value.find(w => w.id === action.id);
    if (win) {
      const snapThreshold = 30; // 画面端から30px以内でスナップ
      const taskbarHeight = 50;
      const screenW = window.innerWidth;
      const screenH = window.innerHeight - taskbarHeight;

      if (e.clientY < snapThreshold) {
        // 上端：最大化
        win.x = 0;
        win.y = 0;
        win.width = screenW;
        win.height = screenH;
      } else if (e.clientX < snapThreshold) {
        // 左端：左半分
        win.x = 0;
        win.y = 0;
        win.width = screenW / 2;
        win.height = screenH;
      } else if (e.clientX > screenW - snapThreshold) {
        // 右端：右半分
        win.x = screenW / 2;
        win.y = 0;
        win.width = screenW / 2;
        win.height = screenH;
      }
    }
  }
  activeAction.value = null;
};

onMounted(async () => {
  await fetchApps();
  await fetchDesktopFiles();
  launchApp('explorer');
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);
});
</script>

<template>
  <div class="os-desktop">
    <!-- アプリバー -->
    <header class="app-bar">
      <div class="left-section">
        <span class="system-menu"></span>
        <span class="app-name">OS-Browser</span>
      </div>
    </header>
    
    <!-- デスクトップ領域 -->
    <main class="desktop-workspace">
      <!-- デスクトップアイコン -->
      <div class="desktop-content">
        <div 
          v-for="file in desktopFiles" 
          :key="file.name" 
          class="desktop-icon"
          @dblclick="launchApp(file.isDirectory ? 'explorer' : 'explorer', file.path)"
        >
          <div class="icon">{{ file.isDirectory ? '📁' : '📄' }}</div>
          <div class="name">{{ file.name }}</div>
        </div>
      </div>

      <div 
        v-for="win in openWindows" 
        :key="win.id" 
        class="window-frame"
        :class="{ dragging: activeAction?.id === win.id }"
        :style="{ 
          zIndex: win.zIndex, 
          left: win.x + 'px', 
          top: win.y + 'px', 
          width: win.width + 'px', 
          height: win.height + 'px' 
        }"
        @mousedown="focusWindow(win.id)"
      >
        <!-- ウィンドウヘッダー (移動用) -->
        <div class="window-header" @mousedown="startMove($event, win)">
          <div class="title">{{ win.title }}</div>
          <div class="window-controls">
            <div class="dot close" @click.stop="closeWindow(win.id)"></div>
          </div>
        </div>

        <!-- アプリ内容 -->
        <div class="window-content">
          <template v-if="win.appId === 'explorer'">
            <FileExplorer 
              @open-app="({ app, path }) => launchApp(app.id, path)"
              @context-menu="handleGlobalContextMenu"
            />
          </template>
          <template v-else-if="win.appId === 'editor'">
            <SimpleEditor 
              :file-path="win.path || ''" 
              @close="closeWindow(win.id)"
              @context-menu="handleGlobalContextMenu"
            />
          </template>
          <template v-else-if="win.appId === 'hex'">
            <HexEditor :file-path="win.path || ''" @close="closeWindow(win.id)" />
          </template>
          <template v-else-if="win.appId === 'calc'">
            <Calculator @close="closeWindow(win.id)" />
          </template>
          <template v-else-if="win.appId === 'paint'">
            <PaintApp @close="closeWindow(win.id)" />
          </template>
          <template v-else-if="win.appId === 'image'">
            <ImageViewer 
              :file-path="win.path || ''" 
              @close="closeWindow(win.id)" 
              @edit-image="(path) => launchApp('image-editor', path)"
            />
          </template>
          <template v-else-if="win.appId === 'image-editor'">
            <ImageEditor :file-path="win.path || ''" @close="closeWindow(win.id)" />
          </template>
          <template v-else-if="win.appId === 'video'">
            <VideoPlayer :file-path="win.path || ''" @close="closeWindow(win.id)" />
          </template>
          <template v-else-if="win.appId === 'browser'">
            <Browser :initial-url="win.path || ''" @close="closeWindow(win.id)" />
          </template>
          <template v-else-if="win.appId === 'taskmanager'">
            <TaskManager 
              :windows="openWindows" 
              @kill-process="(id) => closeWindow(id)"
              @focus-window="(id) => focusWindow(id)"
              @close="closeWindow(win.id)" 
            />
          </template>
          <template v-else-if="win.appId === 'sysinfo'">
            <SystemInfo @close="closeWindow(win.id)" />
          </template>
          <template v-else-if="win.appId === 'terminal'">
            <Terminal :initial-dir="win.path" @close="closeWindow(win.id)" />
          </template>
          <template v-else-if="win.appId === 'minesweeper'">
            <Minesweeper @close="closeWindow(win.id)" />
          </template>
          <template v-else-if="win.appId === 'stickynotes'">
            <StickyNotes @close="closeWindow(win.id)" />
          </template>
          <template v-else>
            <div class="app-placeholder">
              <div class="icon">{{ apps[win.appId]?.icon }}</div>
              <h2>{{ win.title }}</h2>
              <p>このアプリケーションは現在開発中です。</p>
            </div>
          </template>
        </div>

        <!-- リサイズハンドル (右下隅) -->
        <div class="resize-handle" @mousedown="startResize($event, win)"></div>
      </div>
    </main>

    <!-- タスクバー -->
    <footer class="task-bar">
      <div 
        class="start-btn" 
        :class="{ active: isStartMenuOpen }" 
        @click="toggleStartMenu"
        title="Start"
      >
        <div class="start-icon">🪟</div>
      </div>
      <div class="running-apps">
        <div 
          v-for="app in apps" :key="app.id"
          v-show="app.pinned || openWindows.some(w => w.appId === app.id)"
          class="task-icon"
          :class="{ active: openWindows.some(w => w.appId === app.id) }"
          @click="app.id === 'explorer' && openWindows.every(w => w.appId !== 'explorer') && launchApp('explorer')"
        >
          <span>{{ app.icon }}</span>
          <div v-if="openWindows.some(w => w.appId === app.id)" class="indicator"></div>
        </div>
      </div>
      <div class="tray" @click="toggleControlCenter">
        <span class="wifi">📶</span>
        <span class="time">{{ new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</span>
      </div>
    </footer>

    <!-- グローバル・コンテキストメニュー (最前面) -->
    <ContextMenu 
      v-if="globalContextMenu" 
      :x="globalContextMenu.x" 
      :y="globalContextMenu.y" 
      :file="globalContextMenu.file"
      class="global-menu"
      @close="globalContextMenu = null"
      @select-app="(app) => { 
        if (globalContextMenu) {
          launchApp(app.id, globalContextMenu.file.path || globalContextMenu.file.name);
          globalContextMenu = null;
        }
      }"
    />

    <!-- OSメニュー -->
    <StartMenu 
      v-if="isStartMenuOpen" 
      @close="isStartMenuOpen = false" 
      @open-app="({ id, path }) => launchApp(id, path)"
      @navigate="handleStartNavigate"
    />

    <!-- コントロールセンター -->
    <ControlCenter
      v-if="isControlCenterOpen"
      @close="isControlCenterOpen = false"
      @update:night-mode="(val) => $el.classList.toggle('night-mode', val)"
    />
  </div>
</template>

<style>
/* 共通リセット */
body, html, #app {
  margin: 0; padding: 0; width: 100%; height: 100%;
  overflow: hidden; font-family: 'Inter', system-ui, sans-serif;
  background: #000;
}

.os-desktop {
  height: 100vh; display: flex; flex-direction: column;
  background: radial-gradient(circle at 50% 50%, #1e293b 0%, #000 100%);
  color: white;
  transition: filter 0.5s ease;
  position: relative;
}

.os-desktop.night-mode {
  filter: sepia(0.4) saturate(0.8) contrast(0.9);
}

.desktop-content {
  flex-grow: 1;
  position: relative;
  overflow: hidden;
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 20px;
}

.desktop-icon {
  width: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: background 0.2s;
  user-select: none;
}

.desktop-icon:hover {
  background: rgba(255, 255, 255, 0.1);
}

.desktop-icon .icon {
  font-size: 36px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
}

.desktop-icon .name {
  font-size: 11px;
  text-align: center;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.8);
  word-break: break-all;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.app-bar {
  height: 30px; background: rgba(0,0,0,0.5); backdrop-filter: blur(10px);
  display: flex; align-items: center; padding: 0 15px; font-size: 13px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.desktop-workspace { flex-grow: 1; position: relative; }

/* ウィンドウのデザイン */
.window-frame {
  position: absolute;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.window-frame.dragging {
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
  opacity: 0.9;
}

.window-header {
  height: 34px;
  background: #252525;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  cursor: grab;
  position: relative;
  user-select: none;
  border-bottom: 1px solid #101010;
}

.window-header:active { cursor: grabbing; }

.title { font-size: 12px; color: #888; font-weight: 500; }

.window-controls {
  position: absolute; left: 12px; display: flex; gap: 8px;
}

.dot { width: 12px; height: 12px; border-radius: 50%; cursor: pointer; }
.close { background: #ff5f57; }

.window-content { flex-grow: 1; overflow: hidden; position: relative; }

/* リサイズ要素 */
.resize-handle {
  position: absolute; right: 0; bottom: 0;
  width: 15px; height: 15px;
  cursor: nwse-resize;
  background: linear-gradient(135deg, transparent 50%, rgba(255, 255, 255, 0.05) 50%);
  z-index: 100;
}

/* タスクバー */
.task-bar {
  height: 48px; background: rgba(15, 15, 15, 0.7); backdrop-filter: blur(40px) saturate(180%);
  display: flex; align-items: center; padding: 0 12px; border-top: 1px solid rgba(255,255,255,0.05);
  z-index: 10000;
  gap: 15px;
}

.start-btn {
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  font-size: 20px;
}

.start-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.start-btn.active {
  background: rgba(59, 130, 246, 0.3);
  box-shadow: inset 0 0 10px rgba(59, 130, 246, 0.2);
}

.start-icon {
  filter: drop-shadow(0 0 5px rgba(59, 130, 246, 0.5));
}

.running-apps { flex-grow: 1; display: flex; justify-content: center; gap: 12px; }

.task-icon {
  width: 38px; height: 38px; display: flex; justify-content: center; align-items: center;
  border-radius: 9px; cursor: pointer; position: relative; font-size: 22px;
  background: rgba(255, 255, 255, 0.05); transition: 0.2s;
}

.task-icon:hover { background: rgba(255, 255, 255, 0.1); transform: translateY(-2px); }
.task-icon.active { background: rgba(255, 255, 255, 0.15); }
.indicator { position: absolute; bottom: 3px; width: 4px; height: 4px; background: #3b82f6; border-radius: 50%; }

.tray { font-size: 12px; color: #666; padding-right: 10px; }

.global-menu {
  z-index: 9999 !important;
}
</style>
