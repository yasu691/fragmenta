# Fragmenta

React NativeとExpoで作成した、GitHubプライベートリポジトリにMarkdownファイルを投稿できるアプリです。

## 概要

Fragmentaは、テキスト入力をGitHub上のプライベートリポジトリに自動的にMarkdownファイルとして保存できるモバイルアプリケーションです。
メモやアイデアを素早く記録し、GitHubで管理したい方に最適です。

## 技術スタック

- **React Native**: 0.81.4
- **Expo**: SDK 54
- **TypeScript**: 5.9.2
- **React Native Paper**: 5.14.5 (Material Design 3対応)
- **React Navigation**: Bottom Tabs
- **Octokit**: GitHub API クライアント
- **AsyncStorage**: ローカルデータ永続化
- **Expo Secure Store**: トークンの安全な保存

## 主な機能

### 📝 ホーム画面
- テキスト入力 (複数行対応)
- **タグ選択機能** (プルダウンメニュー)
- GitHubへの自動送信 (Frontmatter付き)
- 下書き自動保存機能
- エラーハンドリング&自動リトライ
- ローディング表示

### 📚 履歴画面
- 送信履歴の一覧表示
- **タグ表示** (Chipコンポーネント)
- GitHub上のファイルへのリンク
- 履歴削除機能
- Pull to Refresh

### ⚙️ 設定画面
- GitHub Personal Access Token設定
- リポジトリ情報設定
- **タグ管理機能** (追加/削除/一覧表示)
- 設定の検証機能
- セキュアな認証情報管理

## セットアップ

### 必要な環境

- Node.js 20.19.4以上 (推奨)
- npm または yarn

### インストール

```bash
# 依存パッケージのインストール
npm install
```

## 起動方法

### 開発サーバーの起動

```bash
npm start
```

### プラットフォーム別の起動

```bash
# iOSシミュレーターで起動
npm run ios

# Androidエミュレーターで起動
npm run android

# Webブラウザで起動
npm run web
```

### 実機でのテスト

1. スマートフォンに[Expo Go](https://expo.dev/client)アプリをインストール
2. `npm start`を実行
3. 表示されるQRコードをExpo Goアプリでスキャン

## GitHub設定 (初回のみ)

アプリを初めて使用する際は、以下の手順で設定してください。

### 1. Personal Access Tokenの作成

**Fine-grained tokens (推奨)** を使用してください:

1. GitHubにログイン
2. Settings > Developer settings > Personal access tokens > **Fine-grained tokens**
3. "Generate new token" をクリック
4. 以下を設定:
   - **Token name**: `Fragmenta App` (わかりやすい名前)
   - **Expiration**: 90日程度を推奨 (最大366日)
   - **Repository access**: `Only select repositories` を選択して、投稿先リポジトリを指定
   - **Repository permissions**:
     - `Contents`: **Read and write** ✅ (必須)
     - `Metadata`: **Read only** (自動選択)
5. "Generate token" をクリック
6. トークンをコピー (一度しか表示されません!)

<details>
<summary>Classic Tokensを使う場合 (非推奨)</summary>

1. Settings > Developer settings > Personal access tokens > Tokens (classic)
2. "Generate new token (classic)" をクリック
3. スコープ: `repo` (Full control of private repositories)
4. トークンを生成してコピー

**注意**: Classic tokensはセキュリティリスクが高いため、Fine-grained tokensの使用を強く推奨します。
</details>

### 2. アプリでの設定

1. アプリの「設定」タブを開く
2. 以下の情報を入力:
   - **Personal Access Token**: 先ほどコピーしたトークン
   - **リポジトリオーナー**: GitHubユーザー名または組織名
   - **リポジトリ名**: 投稿先のリポジトリ名
   - **保存先フォルダパス**: ファイルを保存するフォルダ (例: `notes`)
   - **ブランチ名**: 通常は `main` または `master`
3. 「設定を保存」をタップ
4. 設定が自動的に検証されます

## 使い方

### タグを管理する

1. 「設定」タブを開く
2. 「タグ管理」セクションで「追加」ボタンをタップ
3. タグ名を入力（例: 開発メモ、アイデア、TODO）
4. 「追加」ボタンで保存
5. 不要なタグは削除アイコンで削除可能

### テキストを送信する

1. 「ホーム」タブでテキストを入力
2. （オプション）タグプルダウンメニューからタグを選択
3. 「GitHubに送信」ボタンをタップ
4. 自動的に `yyyymmddhhmmss.md` という名前でファイルが作成されます
5. タグを選択した場合は、以下のようなFrontmatterが自動追加されます:
   ```markdown
   ---
   tags: [開発メモ]
   ---

   本文がここに続く...
   ```

### 送信履歴を確認する

1. 「履歴」タブを開く
2. 過去の送信履歴が一覧表示されます
3. タグが付与されている場合は、タグが表示されます
4. アイテムをタップするとGitHub上のファイルを開けます

## プロジェクト構成

```
fragmenta/
├── App.tsx                          # メインアプリ (Navigation設定)
├── src/
│   ├── components/
│   │   ├── ErrorDialog.tsx          # エラーダイアログ
│   │   └── LoadingOverlay.tsx       # ローディング表示
│   ├── screens/
│   │   ├── HomeScreen.tsx           # ホーム画面 (タグ選択含む)
│   │   ├── HistoryScreen.tsx        # 履歴画面 (タグ表示含む)
│   │   └── SettingsScreen.tsx       # 設定画面 (タグ管理含む)
│   ├── services/
│   │   ├── githubService.ts         # GitHub API連携
│   │   └── storageService.ts        # ローカルストレージ管理 (タグ含む)
│   ├── types/
│   │   └── index.ts                 # TypeScript型定義 (Tag, HistoryEntry拡張)
│   └── utils/
│       ├── dateFormatter.ts         # 日時フォーマット
│       └── frontmatterParser.ts     # Frontmatter生成・パース
├── docs/
│   └── daily-reports/               # 日報
├── app.json                         # Expo設定
├── package.json                     # 依存関係
├── tsconfig.json                    # TypeScript設定
└── README.md                        # このファイル
```

## アーキテクチャ

### データフロー

1. **ユーザー入力** → HomeScreen
2. **下書き保存** → StorageService (AsyncStorage)
3. **送信** → GitHubService → GitHub API
4. **履歴保存** → StorageService (AsyncStorage)
5. **履歴表示** → HistoryScreen

### ストレージ

- **SecureStore**: Personal Access Token (暗号化)
- **AsyncStorage**:
  - GitHub設定 (トークン以外)
  - 下書きデータ
  - 送信履歴 (タグ情報含む)
  - タグ一覧
  - アプリ設定

### エラーハンドリング

- ネットワークエラー時の自動リトライ (最大3回)
- エラーダイアログでユーザーに通知
- リトライ可能なエラーには再試行ボタンを表示

## トラブルシューティング

### Node.jsバージョンエラー

一部のパッケージはNode.js 20.19.4以上を要求します。Node.jsのバージョンが古い場合は、[nvm](https://github.com/nvm-sh/nvm)などでアップデートしてください。

### Metro Bundlerが起動しない

```bash
# キャッシュをクリアして再起動
npx expo start -c
```

### iOS Simulatorが起動しない

Xcodeがインストールされていることを確認してください:

```bash
xcode-select --install
```

## セキュリティに関する注意事項

- Personal Access Tokenは**絶対に公開しないでください**
- **Fine-grained tokens を使用**してください(Classic tokensより安全)
- トークンはExpo Secure Storeで暗号化して保存されます
- リポジトリはプライベートリポジトリの使用を推奨します
- トークンには**必要最小限の権限**のみを付与:
  - Fine-grained: `Contents: Read and write` のみ
  - Classic: `repo` スコープのみ
- トークンに**有効期限を設定**してください(90日推奨)

## 今後の拡張案

- [ ] Markdown プレビュー機能
- [x] タグ機能 ✅ (2025-10-20実装完了)
- [ ] タグによる絞り込み・検索機能
- [ ] タグの並び替え機能（ドラッグ&ドロップ）
- [ ] 複数タグ対応
- [ ] 複数リポジトリ対応
- [ ] ダークモード対応
- [ ] オフライン時のキュー機能

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
