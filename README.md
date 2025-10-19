# Fragmenta

React NativeとExpoで作成したシンプルなテキスト入力アプリです。

## 技術スタック

- **React Native**: 0.81.4
- **Expo**: SDK 54
- **TypeScript**: 5.9.2
- **React Native Paper**: 5.14.5 (Material Design 3対応)
- **React Native Safe Area Context**: 5.6.1

## 機能

- テキストエリア (複数行入力対応)
- 送信ボタン
- レスポンシブレイアウト
- Safe Area対応 (ノッチ・ホームインジケーター対応)
- キーボード表示時の自動調整

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

## プロジェクト構成

```
fragmenta/
├── App.tsx                 # メインアプリケーションコンポーネント
├── app.json               # Expo設定ファイル
├── package.json           # プロジェクト依存関係
├── tsconfig.json          # TypeScript設定
└── README.md              # このファイル
```

## コード概要

### App.tsx

メインコンポーネントには以下が実装されています:

- **State管理**: `useState`でテキスト入力の状態管理
- **TextInput**: React Native Paperのアウトラインスタイルテキストエリア
- **Button**: Material Design 3スタイルの送信ボタン
- **レイアウト**: SafeAreaView + KeyboardAvoidingViewで快適なUX

### 送信ボタンの処理

現在、送信ボタンの`handleSubmit`関数は以下のように実装されています:

```typescript
const handleSubmit = () => {
  // 処理ロジックは未実装
  console.log('Submit button pressed');
};
```

実際の処理ロジックを追加する場合は、この関数内に実装してください。

## カスタマイズ

### テーマの変更

[App.tsx](App.tsx)の`MD3LightTheme`を`MD3DarkTheme`に変更することで、ダークモードに対応できます:

```typescript
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';

// ...

<PaperProvider theme={MD3DarkTheme}>
```

### スタイルの調整

`styles`オブジェクト内のStyleSheetを編集することで、レイアウトや色を変更できます。

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

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルを参照してください。

## 次のステップ

- [ ] 送信ボタンの処理ロジック実装
- [ ] API連携
- [ ] データ永続化 (AsyncStorage)
- [ ] フォームバリデーション
- [ ] エラーハンドリング
- [ ] ローディング状態の表示
