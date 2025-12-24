# OS-Browser AI Implementation Documentation

このドキュメントは、別のAIが本プロジェクト「OS-Browser」の開発を継続・拡張するための技術仕様書です。

## 1. プロジェクト概要
OS-Browser は、ブラウザ上で動作するオペレーティングシステム風のインターフェースを持つWebアプリケーションです。
- **Frontend**: Vue 3 + TypeScript + Vanilla CSS
- **Backend**: Bun (Elysiaベースの軽量API) + TypeScript
- **特徴**: ホストOS（Windows）のファイルシステムやシステムリソースと直接連携する「実用性」を重視しています。

## 2. アーキテクチャ

### フロントエンド (`frontend/src`)
- **`App.vue` (Core)**: 
  - ウィンドウマネージャ、タスクバー、スタートメニュー、コントロールセンターを統括。
  - `WindowState` インターフェースによる動的なウィンドウ管理。
  - ドラッグ&ドロップによる移動、リサイズ、ウィンドウスナップ（画面端整列）を実装。
- **`views/`**: 各種アプリケーション（FileExplorer, TaskManager, Terminal, Browser等）。
- **`components/`**: OSパーツ（StartMenu, ControlCenter, ContextMenu等）。

### バックエンド (`backend/`)
- **`index.ts`**: 単一のBunサーバファイル。
- **主要機能**:
  - `/api/files`: ディレクトリ一覧、ファイル内容の読み書き。
  - `/api/terminal`: ホストOSでのコマンド実行 (PowerShell/cmd)。
  - `/api/stats`: CPU/メモリのリアルタイム統計 (osモジュール)。
  - **LNKファイル解決**: Windowsの `.lnk` ファイルを解決し、ターゲットパスを取得する `resolveLnk` 関数（PowerShellスクリプト実行）を内蔵。

## 3. 新しいアプリを追加する手順

別のAIが新機能（例: Music Player）を追加する場合、以下の3ステップが必要です。

1. **ビューコンポーネントの作成**:
   - `frontend/src/views/MyNewApp.vue` を作成。
   - 基本的に `height: 100%` で実装。
2. **バックエンドへの登録**:
   - `backend/index.ts` の `APPS_REGISTRY` にアプリ情報を追加（ID, 名前, アイコン等）。
3. **App.vue への統合**:
   - `App.vue` で新しいビューをインポート。
   - テンプレート内の `v-if="win.appId === '... '"` ループにコンポーネントを追加。

## 4. 重要ロジック・注意点

### ウィンドウ管理
- `openWindows` 配列に `WindowState` を push することでアプリが起動します。
- `zIndex` 管理により、クリックされたウィンドウを最前面に持ってくる `focusWindow` ロジックがあります。

### スナップ機能 (`App.vue` : `handleMouseUp`)
- マウスが画面端（30px以内）で離された際、ウィンドウの `x, y, width, height` を自動調整して整列させます。

### デザインシステム
- **エフェクト**: `backdrop-filter: blur()` によるアクリル/グラスモフィズムを多用。
- **アニメーション**: CSS `transition` と Vue のアニメーションフックによるスムーズな開閉。

## 5. バックエンドAPIリファレンス
- `GET /api/files?path=...`: 指定パスのファイル一覧取得。
- `POST /api/terminal`: `{ "command": "...", "cwd": "..." }` を受け取り実行。
- `GET /api/stats`: システムリソース情報のJSON。

---
このプロジェクトは、Web技術でネイティブOSに近い体験を作ることを目指しています。UIは常にリッチでプレミアムなものを維持してください。
