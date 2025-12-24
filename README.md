# ☁️ OS-Browser

**OS-Browser** は、Sofia Lucat Project が提案する、Webブラウザ上で動作する次世代の **HTTP グラフィカル・ファイル管理ツール** です。

Windows OS のような直感的で馴染みのあるデスクトップインターフェースを提供し、サーバー上のリソース（ファイルやフォルダ）をまるでローカル環境のように操作することを目指しています。

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/ddb26be5-bd2a-4218-8e86-80019c20c853" />


---

## 🚀 ビジョン

> **「サーバー管理を、もっと身近に。どのデバイスからも、いつもの操作を。」**

多くのサーバー管理ツールはコマンドラインや無機質なWebUIに依存していますが、OS-Browser は「OSそのもの」をブラウザに持ち込むことで、専門知識がなくても直感的にアイテムの表示、アップロード、ダウンロード、整理を行える環境を提供します。

---

## ✨ 主な機能

- 🗂️ **WindowsライクなUI/UX**: デスクトップ、ウィンドウ、タスクバー、ファイルエクスプローラーを備えた親しみやすい設計。
- ☁️ **一貫した操作感**: 接続先のOSに依存せず、常に同じインターフェースでファイル管理が可能。
- 📤 **ドラッグ＆ドロップ**: ブラウザへのドラッグ＆ドロップによる直感的なアップロード。
- 🖼️ **マルチメディアプレビュー**: 画像、動画、ドキュメントの即時表示（予定）。
- ⚙️ **高速な動作**: Bun.js と Vue.js 3 を活用した、ストレスのないレスポンス。

---

## 🛠️ 技術スタック

| カテゴリ         | 技術                                    |
| :--------------- | :-------------------------------------- |
| **Runtime**      | [Bun.js](https://bun.sh/)               |
| **Backend**      | Bun.serve / TypeScript                  |
| **Frontend**     | [Vue.js 3](https://vuejs.org/) (Vite)   |
| **Styling**      | [TailwindCSS](https://tailwindcss.com/) |
| **Architecture** | Client-Server (REST API)                |

---

## 🎨 設計コンセプト & 独自システム

### 1. テーマ・カスタマイズ・エンジン
OS-Browser は、見た目だけでなく「体験」をカスタマイズ可能です。
- **Theme JSON**: 色、透過度、フォント、アイコンパックを定義する JSON ベースのテーマシステム。
- **Community Themes**: GitHub 等で公開されたテーマを URL 指定でインポート可能。
- **On-the-fly Switching**: 再読み込みなしで、瞬時にデスクトップの雰囲気を切り替え。

### 2. エクステンション（拡張機能）アーキテクチャ
「ブラウザの中のOS」を拡張するためのプラグインシステム。
- **Sandboxed Scripts**: メインUIに干渉せず、独自のウィンドウや機能を追加。
- **Hook System**: ファイル操作（開く、編集）に独自のアプリを紐付け可能。

### 3. エンタープライズ・セキュリティ
サーバーの安全を守るための多層防御。
- **IP Access Filtering**: ホワイトリスト/ブラックリスト形式による接続元制限。
- **End-to-End Encryption**: 全ての通信は HTTPS/WSS で保護され、機密データの機密性を保持。
- **Brute-force Protection**: 不正なログイン試行を自動的に検知・ブロック。

---

## 📂 ディレクトリ構造

```text
├── backend/            # Bun.serveサーバー (ファイルシステム操作 & セキュリティ層)
│   ├── security/       # IPフィルタリング、認証ロジック
│   └── server.ts
├── frontend/           # Vue.js フロントエンド (UI/UX & プラグイン層)
│   ├── src/
│   │   ├── themes/     # テーマ定義ファイル
│   │   ├── extensions/ # 拡張機能ローダー
│   │   ├── components/ # UIコンポーネント
│   │   ├── App.vue
│   │   └── main.ts
│   └── index.html
├── package.json
├── vite.config.ts
├── start_app.ts
└── README.md
```

---

## 🚦 クイックスタート

### 1. 依存関係のインストール
```bash
bun install
```

### 2. アプリケーションの起動
```bash
bun run start_app.ts
```

### 3. 開発環境個別起動
```bash
cd backend
bun dev
cd frontend
bun dev
```

---

## 🗺️ ロードマップ
- [x] Windowsライクな基本UIの実装
- [ ] **[In Progress]** テーマエンジンの開発
- [ ] **[Planning]** 拡張機能 SDK の公開
- [ ] **[Crucial]** IPフィルタリング・セキュリティ設定画面の追加
- [ ] マルチウィンドウ管理システムの改善
- [ ] SSL/TLS 設定の自動化

---

## 📄 ライセンス
Copyright © 2025 **Sofia Lucat Project**. All Rights Reserved.


