# iOS端末へのインストールガイド

このガイドでは、FragmentaアプリをiOS端末にインストールする方法を説明します。

## 目次

1. [開発ビルド (Expo Go使用)](#1-開発ビルド-expo-go使用)
2. [プロダクションビルド (IPA)](#2-プロダクションビルド-ipa)
3. [EAS Build使用 (推奨)](#3-eas-build使用-推奨)
4. [ローカルビルド](#4-ローカルビルド)

---

## 1. 開発ビルド (Expo Go使用)

最も簡単な方法です。開発・テスト用に最適です。

### 必要なもの

- iOS端末
- Expo Goアプリ
- PCとiOS端末が同じWi-Fiネットワークに接続されていること

### 手順

#### ステップ1: Expo Goアプリをインストール

iOS端末でApp Storeから[Expo Go](https://apps.apple.com/app/expo-go/id982107779)をインストールします。

#### ステップ2: 開発サーバーを起動

```bash
npm start
```

#### ステップ3: QRコードをスキャン

1. ターミナルに表示されるQRコードをExpo Goアプリでスキャン
2. アプリが自動的に読み込まれます

### メリット・デメリット

✅ **メリット**
- セットアップが簡単
- 即座にテスト可能
- ホットリロード対応

❌ **デメリット**
- Expo Goアプリが必要
- 一部のネイティブモジュールが使用不可
- 開発環境でのみ動作

---

## 2. プロダクションビルド (IPA)

実際の配布用アプリを作成する方法です。

### ビルド形式

- **IPA** (iOS App Store Package): iOSアプリのインストールファイル
  - App Store配布用
  - TestFlight配布用
  - Ad Hoc配布用 (限定された端末へのインストール)

---

## 3. EAS Build使用 (推奨)

Expoが提供するクラウドビルドサービスを使用します。

### 事前準備

#### ステップ1: EAS CLIをインストール

```bash
npm install -g eas-cli
```

#### ステップ2: Expoアカウントでログイン

```bash
eas login
```

アカウントがない場合は[expo.dev](https://expo.dev)で作成してください。

#### ステップ3: Apple Developer Programへの登録

iOSアプリをビルド・配布するには、Apple Developer Programへの登録が必須です。

- 個人アカウント: 年間99ドル
- 組織アカウント: 年間99ドル

[Apple Developer Program](https://developer.apple.com/programs/)で登録してください。

#### ステップ4: プロジェクトを設定

```bash
eas build:configure
```

これにより`eas.json`ファイルが作成されます。

### 開発ビルド (Simulatorテスト用)

#### ステップ1: Simulatorビルドを作成

```bash
eas build --platform ios --profile development
```

初回は以下の質問があります:
- **Generate a new Apple Distribution Certificate?**: `Yes`を選択
- **Generate a new Apple Provisioning Profile?**: `Yes`を選択

ビルドには5〜20分程度かかります。

#### ステップ2: Simulatorで実行

ビルドが完了したら、ダウンロードしてSimulatorで実行できます。

```bash
# ビルドをダウンロード
# Simulatorを起動
open -a Simulator

# IPAをSimulatorにインストール
xcrun simctl install booted path/to/app.app
```

### Internal Distribution (実機テスト用)

#### ステップ1: Internal Distributionビルドを作成

```bash
eas build --platform ios --profile preview
```

#### ステップ2: TestFlightで配布

1. ビルド完了後、[Expo Dashboard](https://expo.dev)にアクセス
2. ビルドページから「Submit to App Store」を選択
3. TestFlightに自動的にアップロードされます

#### ステップ3: TestFlightからインストール

1. iOS端末でApp Storeから[TestFlight](https://apps.apple.com/app/testflight/id899247664)をインストール
2. TestFlightアプリでFragmentaを選択
3. 「インストール」をタップ

### App Store配布用ビルド

```bash
eas build --platform ios --profile production
```

生成されたIPAファイルをApp Store Connectにアップロードします:

```bash
eas submit --platform ios
```

### EAS Buildの設定カスタマイズ

`eas.json`を編集して、ビルド設定をカスタマイズできます:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "autoIncrement": true,
      "ios": {
        "simulator": false
      }
    }
  }
}
```

---

## 4. ローカルビルド

自分のMacでビルドする方法です。XcodeとmacOSが必要です。

### 事前準備

#### 必要な環境

- macOS
- Xcode 15以上
- CocoaPods
- Node.js 20.19.4以上
- Apple Developer Programアカウント

#### ステップ1: Xcodeのセットアップ

1. App Storeから[Xcode](https://apps.apple.com/app/xcode/id497799835)をダウンロード・インストール
2. Xcodeを起動し、Command Line Toolsをインストール

```bash
xcode-select --install
```

#### ステップ2: CocoaPodsのインストール

```bash
sudo gem install cocoapods
```

### ローカルビルド手順

#### ステップ1: プロジェクトをprebuild

```bash
npx expo prebuild --platform ios
```

これにより`ios`フォルダが生成されます。

#### ステップ2: 依存関係をインストール

```bash
cd ios
pod install
cd ..
```

#### ステップ3: Xcodeでプロジェクトを開く

```bash
open ios/fragmenta.xcworkspace
```

⚠️ **注意**: `fragmenta.xcodeproj`ではなく、`fragmenta.xcworkspace`を開いてください。

#### ステップ4: 署名設定

1. Xcodeでプロジェクトを選択
2. 「Signing & Capabilities」タブを開く
3. 「Team」でApple Developer Programのチームを選択
4. 「Bundle Identifier」を一意のものに変更 (例: `com.yasu691.fragmenta`)

#### ステップ5: ビルドターゲットを選択

1. Xcodeの上部で、ビルドターゲットを選択
   - Simulatorテスト: 任意のiOS Simulator
   - 実機テスト: 接続されたiOS端末

#### ステップ6: ビルド & 実行

1. Xcodeで「Product」→「Run」(⌘R)
2. アプリが自動的にビルドされ、選択したターゲットで起動します

### Archive & Export (配布用)

#### ステップ1: Archiveを作成

1. Xcodeで「Product」→「Destination」→「Any iOS Device (arm64)」を選択
2. 「Product」→「Archive」を選択
3. Archiveが完了するまで待機

#### ステップ2: IPAをExport

1. Organizerウィンドウが開きます
2. 作成したArchiveを選択し、「Distribute App」をクリック
3. 配布方法を選択:
   - **App Store Connect**: App Store配布用
   - **Ad Hoc**: 限定的な実機配布用
   - **Enterprise**: 社内配布用 (Enterprise Programのみ)
   - **Development**: 開発用

4. 画面の指示に従ってExport

#### ステップ3: IPAをインストール

##### TestFlight経由 (推奨)

1. App Store ConnectにIPAをアップロード
2. TestFlightで配布

##### Xcode経由 (開発・テスト)

1. iOS端末をMacに接続
2. Xcodeの「Window」→「Devices and Simulators」を開く
3. 端末を選択し、「+」ボタンでIPAを追加

---

## 推奨される方法

### 開発・テスト段階
→ **Expo Go** (最も簡単)

### 実機テスト・ベータ配布
→ **EAS Build + TestFlight** (クラウドで簡単)

### App Store配布
→ **EAS Build + eas submit** (自動化可能)

### 完全なカスタマイズが必要
→ **ローカルビルド** (上級者向け)

---

## トラブルシューティング

### EAS Buildでエラーが出る

```bash
# キャッシュをクリア
eas build --platform ios --profile preview --clear-cache
```

### 署名エラー (Code Signing Error)

1. Apple Developer Portalで証明書とプロビジョニングプロファイルを確認
2. Xcodeで「Signing & Capabilities」の設定を確認
3. Bundle Identifierが一意であることを確認

### CocoaPodsのエラー

```bash
# CocoaPodsのキャッシュをクリア
cd ios
pod deintegrate
pod install
cd ..
```

### Xcodeビルドエラー

```bash
# クリーンビルド
cd ios
xcodebuild clean
cd ..

# 再prebuild
npx expo prebuild --platform ios --clean
```

### TestFlightにアップロードできない

1. App Store Connectでアプリが登録されているか確認
2. Bundle IdentifierがApp Store Connectの登録と一致しているか確認
3. バージョン番号が正しいか確認 (既存より大きい値)

### Simulatorで起動しない

```bash
# Simulatorをリセット
xcrun simctl erase all

# Simulatorを再起動
killall Simulator
open -a Simulator
```

---

## セキュリティ注意事項

⚠️ **証明書とプロビジョニングプロファイルの管理**
- Apple Developer Portalで適切に管理
- Gitにコミットしない (`.gitignore`に追加)
- チーム開発の場合はEAS Buildの自動管理を推奨

⚠️ **Bundle Identifier**
- 一意の識別子を使用
- 本番環境と開発環境で分けることを推奨
  - 本番: `com.yasu691.fragmenta`
  - 開発: `com.yasu691.fragmenta.dev`

---

## 参考リンク

- [Expo Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Build](https://docs.expo.dev/build/setup/)
- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [TestFlight Guide](https://developer.apple.com/testflight/)
- [App Store Connect](https://appstoreconnect.apple.com/)

---

## まとめ

初めての場合は、**EAS Build + TestFlight**を使用することを強くお勧めします。macOSやXcodeの複雑な設定を避けて、確実にビルドできます。

```bash
# クイックスタート (EAS Build + TestFlight)
npm install -g eas-cli
eas login
eas build:configure
eas build --platform ios --profile preview
eas submit --platform ios
```

これで、TestFlight経由でiOS端末にインストール可能なアプリが手に入ります!
