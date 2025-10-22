# PWA・Web デプロイ セットアップ完了ガイド

このプロジェクトはPWA化され、複数のプラットフォームでのデプロイに対応しました。

## 🎉 完了したセットアップ

### ✅ PWA設定（`app.json`）
- アプリ名、説明、テーマカラー設定済み
- スタンドアロン表示（ネイティブアプリのような表示）
- 画面向き固定（ポートレート）

### ✅ デプロイスクリプト（`package.json`）
```bash
npm run build:web    # Webビルド
npm run deploy       # Netlify本番デプロイ
npm run deploy:dry   # Netlify試験デプロイ
```

### ✅ ホスティング設定
- `netlify.toml` - Netlify自動デプロイ設定
- `vercel.json` - Vercel対応設定
- `public/_redirects` - SPA用リダイレクト

### ✅ 必要なアセット
- `icon.png` ✓
- `favicon.png` ✓
- `splash-icon.png` ✓
- `adaptive-icon.png` ✓

---

## 🚀 クイックスタート

### 1. ローカルテスト
```bash
npm run web
```
ブラウザが開き、`http://localhost:8081`でプレビュー可能。

### 2. Webビルド作成
```bash
npm run build:web
```
`dist/`フォルダに本番用ファイルが生成されます。

### 3. Netlifyへデプロイ

#### GitHub連携で自動デプロイ（推奨）
1. [Netlify](https://www.netlify.com/)にログイン
2. 「Add new site」→「Import an existing project」
3. GitHubリポジトリを選択
4. 以降、mainブランチへのpushで自動デプロイ

#### 手動デプロイ
```bash
# Netlify CLIのインストール（初回のみ）
npm install -g netlify-cli

# ログイン
netlify login

# 本番デプロイ
npm run deploy
```

---

## 📱 PWA機能の確認

### デスクトップ（Chrome/Edge）
1. デプロイしたURLにアクセス
2. アドレスバーに「インストール」ボタンが表示される
3. クリックしてインストール

### モバイル（iOS Safari）
1. Safariでアクセス
2. 共有ボタン（↑）をタップ
3. 「ホーム画面に追加」を選択

### モバイル（Android Chrome）
1. Chromeでアクセス
2. メニュー（⋮）から「ホーム画面に追加」を選択

---

## 🔍 PWA動作確認（DevTools）

1. デプロイしたサイトをChromeで開く
2. DevTools（F12）を開く
3. 「Application」タブ → 以下を確認:
   - **Manifest**: manifest.jsonが読み込まれているか
   - **Service Workers**: Service Workerが登録されているか
   - **Storage**: キャッシュが機能しているか

---

## 🔧 Vercel対応（オプション）

Vercelにもデプロイ可能です：

```bash
# Vercel CLIのインストール
npm install -g vercel

# デプロイ
vercel --prod
```

設定は`vercel.json`に保存済みです。

---

## 🐛 トラブルシューティング

### PWAがインストールできない場合
- ✓ HTTPSが必須（ローカル環境以外）
- ✓ manifest.jsonが正しく読み込まれているか確認
- ✓ DevToolsの「Application」タブで確認

### デプロイ後に404エラー
- ✓ `netlify.toml`のリダイレクト設定を確認
- ✓ または`public/_redirects`を確認

### ビルドエラー
```bash
# キャッシュをクリア
npx expo start --clear

# 依存関係を再インストール
rm -rf node_modules
npm install
npm run build:web
```

---

## 📚 参考ドキュメント

- [Expo Web Documentation](https://docs.expo.dev/workflow/web/)
- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Netlify Documentation](https://docs.netlify.com/)
- [Vercel Documentation](https://vercel.com/docs)

---

## 次のステップ

1. **GitHub連携を設定**
   - Netlifyでリポジトリを連携
   - 自動デプロイが有効になります

2. **カスタムドメインを追加**
   - Netlifyダッシュボードの「Domain settings」から設定

3. **環境変数の設定**
   - `.env.production`ファイルを作成
   - `EXPO_PUBLIC_*`プレフィックスで環境変数を定義

---

✨ PWA化セットアップ完了！これで全世界からアクセス可能なアプリになります。
