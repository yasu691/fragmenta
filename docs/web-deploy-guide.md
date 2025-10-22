# Web版デプロイガイド

このガイドでは、FragmentaアプリをWebブラウザで動作するアプリケーションとしてデプロイする方法を説明します。

## 目次

1. [ローカル開発環境](#1-ローカル開発環境)
2. [Web版のビルド](#2-web版のビルド)
3. [デプロイ方法](#3-デプロイ方法)
4. [PWA化（Progressive Web App）](#4-pwa化progressive-web-app)
5. [デスクトップアプリ化](#5-デスクトップアプリ化)

---

## 1. ローカル開発環境

開発中にWebブラウザでアプリを確認できます。

### 手順

```bash
npm run web
```

ブラウザが自動的に開き、`http://localhost:8081`でアプリが起動します。

### メリット
- ホットリロード対応
- 開発者ツールでデバッグ可能
- iOS/Androidエミュレータ不要

---

## 2. Web版のビルド

本番環境用のビルドを作成します。

### 事前準備: Web依存関係のインストール

Web版を動作させるには、以下の依存関係が必要です。

```bash
npx expo install react-dom react-native-web
```

これにより、React NativeコンポーネントがWeb用に変換されます。

### 基本的なビルド

```bash
npx expo export --platform web
```

これにより`dist/`フォルダに本番用ファイルが生成されます。

⚠️ **注意**: Expo SDK 54以降では`expo export:web`は非推奨です。`expo export --platform web`を使用してください。

### ビルド内容

- HTML、CSS、JavaScript
- 最適化・圧縮済み
- 静的ファイルとして配信可能

---

## 3. デプロイ方法

### 3-A. Netlify（推奨）

最も簡単で、無料プランが充実しています。

#### 事前準備

1. [Netlify](https://www.netlify.com/)でアカウント作成
2. GitHubリポジトリと連携（推奨）

#### 方法1: GitHub連携（自動デプロイ）

1. Netlifyダッシュボードで「Add new site」→「Import an existing project」
2. GitHubを選択し、リポジトリを選択
3. ビルド設定:
   ```
   Build command: npx expo export --platform web
   Publish directory: dist
   ```
4. 「Deploy site」をクリック

以降、GitHubにpushするたびに自動デプロイされます。

**推奨**: リポジトリに`netlify.toml`を配置すると、設定が自動的に読み込まれます:

```toml
[build]
  command = "npx expo export --platform web"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### 方法2: 手動デプロイ

```bash
# ビルド
npx expo export --platform web

# Netlify CLIをインストール
npm install -g netlify-cli

# ログイン
netlify login

# デプロイ
netlify deploy --prod --dir=dist
```

#### カスタムドメイン設定

1. Netlifyダッシュボードで「Domain settings」
2. 「Add custom domain」で独自ドメインを追加
3. DNS設定を更新

---

### 3-B. Vercel

Netlifyと同様に、簡単で高速なデプロイが可能です。

#### 事前準備

1. [Vercel](https://vercel.com/)でアカウント作成
2. Vercel CLIをインストール

```bash
npm install -g vercel
```

#### デプロイ手順

```bash
# ビルド
npx expo export --platform web

# ログイン
vercel login

# デプロイ
vercel --prod
```

初回デプロイ時の質問:
- **Set up and deploy?**: `Y`
- **Which scope?**: 自分のアカウントを選択
- **Link to existing project?**: `N`
- **What's your project's name?**: `fragmenta`
- **In which directory is your code located?**: `./`
- **Want to override the settings?**: `Y`
  - **Build Command**: `npx expo export --platform web`
  - **Output Directory**: `dist`
  - **Development Command**: `npm run web`

デプロイが完了すると、`https://fragmenta.vercel.app`のようなURLが発行されます。

#### GitHub連携

Vercelダッシュボードで「Import Project」からGitHubリポジトリを連携すると、自動デプロイが設定できます。

---

### 3-C. GitHub Pages

無料で静的サイトをホスティングできます。

#### 事前準備

1. `package.json`にhomepageを追加

```json
{
  "homepage": "https://[あなたのGitHubユーザー名].github.io/fragmenta"
}
```

2. デプロイ用パッケージをインストール

```bash
npm install --save-dev gh-pages
```

3. `package.json`にデプロイスクリプトを追加

```json
{
  "scripts": {
    "predeploy": "npx expo export --platform web",
    "deploy": "gh-pages -d dist"
  }
}
```

#### デプロイ

```bash
npm run deploy
```

数分後、`https://[ユーザー名].github.io/fragmenta`でアクセス可能になります。

#### GitHub設定

1. GitHubリポジトリの「Settings」→「Pages」
2. Source: `gh-pages`ブランチを選択
3. 「Save」をクリック

---

### 3-D. Firebase Hosting

Googleが提供する無料ホスティングサービスです。

#### 事前準備

1. [Firebase Console](https://console.firebase.google.com/)でプロジェクト作成
2. Firebase CLIをインストール

```bash
npm install -g firebase-tools
```

#### 初期設定

```bash
# ログイン
firebase login

# プロジェクト初期化
firebase init hosting
```

設定内容:

- **What do you want to use as your public directory?**: `dist`
- **Configure as a single-page app?**: `Y`
- **Set up automatic builds and deploys with GitHub?**: お好みで

#### デプロイ

```bash
# ビルド
npx expo export --platform web

# デプロイ
firebase deploy --only hosting
```

デプロイ後、`https://[プロジェクトID].web.app`でアクセス可能です。

---

### 3-E. 自前サーバー

既存のWebサーバーがある場合は、ビルドファイルを配置するだけです。

```bash
# ビルド
npx expo export --platform web

# dist/ フォルダの内容をサーバーにアップロード
scp -r dist/* user@server:/var/www/html/fragmenta/
```

#### Nginx設定例

```nginx
server {
    listen 80;
    server_name fragmenta.example.com;
    root /var/www/html/fragmenta;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### Apache設定例

`.htaccess`ファイルを`dist/`に配置:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## 4. PWA化（Progressive Web App）

PWAにすることで、ホーム画面に追加したり、オフラインで動作するアプリにできます。

### 4-1. PWA設定の追加

#### `app.json`にPWA設定を追加

```json
{
  "expo": {
    "web": {
      "favicon": "./assets/favicon.png",
      "name": "Fragmenta",
      "shortName": "Fragmenta",
      "description": "GitHub Issueをフラグメント形式で投稿するアプリ",
      "themeColor": "#6200ee",
      "backgroundColor": "#ffffff",
      "display": "standalone",
      "orientation": "portrait",
      "startUrl": "/"
    }
  }
}
```

#### 設定項目の説明

- **name**: アプリの正式名称
- **shortName**: ホーム画面に表示される短縮名
- **description**: アプリの説明
- **themeColor**: ブラウザのテーマカラー
- **backgroundColor**: スプラッシュ画面の背景色
- **display**: `standalone`でネイティブアプリのような表示
- **orientation**: 画面の向き（`portrait`、`landscape`、`any`）
- **startUrl**: アプリ起動時のURL

### 4-2. アイコンの設定

PWA用のアイコンを用意します。

#### 必要なアイコンサイズ

- `icon.png`: 1024x1024px（基本アイコン）
- `favicon.png`: 48x48px（ファビコン）

Expoが自動的に必要なサイズを生成します。

### 4-3. Service Workerの設定

Expoはデフォルトでservice workerを生成しますが、カスタマイズも可能です。

#### 基本設定（自動）

```bash
npx expo export:web
```

これで自動的にservice workerが生成されます。

#### カスタムService Worker

より高度なオフライン対応が必要な場合:

1. `public/service-worker.js`を作成
2. キャッシュ戦略を実装

```javascript
// 例: キャッシュファースト戦略
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

### 4-4. Manifest.jsonの確認

ビルド後、`web-build/manifest.json`が生成されていることを確認します。

```json
{
  "name": "Fragmenta",
  "short_name": "Fragmenta",
  "description": "GitHub Issueをフラグメント形式で投稿するアプリ",
  "icons": [
    {
      "src": "/icon.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#6200ee",
  "background_color": "#ffffff"
}
```

### 4-5. PWAのテスト

#### デスクトップ（Chrome/Edge）

1. デプロイしたURLにアクセス
2. アドレスバーに「インストール」アイコンが表示される
3. クリックして「インストール」

#### モバイル（iOS Safari）

1. デプロイしたURLにアクセス
2. 共有ボタン（↑）をタップ
3. 「ホーム画面に追加」を選択

#### モバイル（Android Chrome）

1. デプロイしたURLにアクセス
2. メニューから「ホーム画面に追加」を選択

### 4-6. PWAの動作確認

#### Chrome DevToolsで確認

1. デプロイしたサイトを開く
2. DevToolsを開く（F12）
3. 「Application」タブを選択
4. 以下を確認:
   - **Manifest**: 正しく読み込まれているか
   - **Service Workers**: 登録されているか
   - **Storage**: キャッシュが機能しているか

#### Lighthouse監査

1. DevToolsの「Lighthouse」タブ
2. 「PWA」カテゴリをチェック
3. 「Generate report」をクリック
4. PWAスコアと改善点を確認

---

## 5. デスクトップアプリ化

より本格的なデスクトップアプリにする場合の方法です。

### 5-1. Electron（推奨）

#### インストール

```bash
npm install --save-dev electron electron-builder
```

#### `electron-main.js`を作成

```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // 本番環境ではビルドしたファイルを読み込む
  mainWindow.loadFile(path.join(__dirname, 'web-build', 'index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

#### `package.json`に設定を追加

```json
{
  "main": "electron-main.js",
  "scripts": {
    "electron": "electron .",
    "electron:build": "electron-builder"
  },
  "build": {
    "appId": "com.yasu691.fragmenta",
    "productName": "Fragmenta",
    "directories": {
      "output": "dist-electron"
    },
    "files": [
      "web-build/**/*",
      "electron-main.js"
    ],
    "mac": {
      "category": "public.app-category.productivity"
    },
    "win": {
      "target": "nsis"
    },
    "linux": {
      "target": "AppImage"
    }
  }
}
```

#### ビルド & パッケージング

```bash
# Webビルド
npx expo export:web

# Electronアプリとしてパッケージング
npm run electron:build
```

`dist-electron/`フォルダに実行ファイルが生成されます:
- Windows: `.exe`
- macOS: `.app`
- Linux: `.AppImage`

---

### 5-2. Tauri（軽量版）

Electronの代替として、軽量で高速なTauriも選択肢です。

#### インストール

```bash
npm install --save-dev @tauri-apps/cli
npx tauri init
```

#### 設定

`src-tauri/tauri.conf.json`を編集:

```json
{
  "build": {
    "distDir": "../web-build"
  }
}
```

#### ビルド

```bash
npx expo export:web
npx tauri build
```

---

## 推奨される方法

### 個人プロジェクト・小規模
→ **Netlify / Vercel** (無料で簡単)

### 企業・商用利用
→ **Firebase Hosting / 自前サーバー**

### PWA対応が必要
→ **どのホスティングでも可能** (PWA設定を追加するだけ)

### デスクトップアプリが必要
→ **Electron** (Windows/Mac/Linux対応)

---

## トラブルシューティング

### ビルドエラー

```bash
# キャッシュをクリア
npx expo start --clear

# 依存関係を再インストール
rm -rf node_modules
npm install
npx expo export:web
```

### PWAがインストールできない

1. HTTPSが必須（ローカル環境以外）
2. manifest.jsonが正しく読み込まれているか確認
3. Service Workerが登録されているか確認

### デプロイ後に404エラー

SPAのルーティング設定が必要です:

#### Netlify

`public/_redirects`ファイルを作成:

```
/*    /index.html   200
```

#### Vercel

`vercel.json`を作成:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

### 環境変数の設定

本番環境で環境変数を使用する場合:

#### `.env.production`を作成

```
EXPO_PUBLIC_API_URL=https://api.example.com
```

#### ビルド時に読み込み

```bash
npx expo export --platform web
```

Expoは自動的に`EXPO_PUBLIC_`プレフィックスの変数を読み込みます。

---

## セキュリティ注意事項

⚠️ **重要**: Web版では以下に注意してください

- **環境変数**: クライアント側で見える変数には機密情報を含めない
- **HTTPS**: 本番環境では必ずHTTPSを使用
- **CORS**: APIサーバーで適切なCORS設定を行う
- **認証トークン**: SecureStorageの代わりにlocalStorageやsessionStorageを使う場合は注意

---

## 参考リンク

- [Expo Web Documentation](https://docs.expo.dev/workflow/web/)
- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Netlify Documentation](https://docs.netlify.com/)
- [Vercel Documentation](https://vercel.com/docs)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)
- [Electron Documentation](https://www.electronjs.org/docs)

---

## まとめ

**最速でWeb公開する方法:**

```bash
# 1. Web依存関係をインストール
npx expo install react-dom react-native-web

# 2. ビルド
npx expo export --platform web

# 3. Netlifyにデプロイ
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=dist
```

これで数分後には全世界からアクセス可能なWebアプリが完成します!

**PWA化も追加する場合:**

`app.json`にPWA設定を追加してから同じ手順を実行するだけです。
