# Android端末へのインストールガイド

このガイドでは、FragmentaアプリをAndroid端末にインストールする方法を説明します。

## 目次

1. [開発ビルド (Expo Go使用)](#1-開発ビルド-expo-go使用)
2. [プロダクションビルド (APK/AAB)](#2-プロダクションビルド-apkaab)
3. [EAS Build使用 (推奨)](#3-eas-build使用-推奨)
4. [ローカルビルド](#4-ローカルビルド)

---

## 1. 開発ビルド (Expo Go使用)

最も簡単な方法です。開発・テスト用に最適です。

### 必要なもの

- Android端末
- Expo Goアプリ
- PCとAndroid端末が同じWi-Fiネットワークに接続されていること

### 手順

#### ステップ1: Expo Goアプリをインストール

Android端末でGoogle Play Storeから[Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)をインストールします。

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

## 2. プロダクションビルド (APK/AAB)

実際の配布用アプリを作成する方法です。

### 2つのビルド形式

- **APK** (Android Package): 直接インストール可能
- **AAB** (Android App Bundle): Google Play配布用 (推奨)

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

#### ステップ3: プロジェクトを設定

```bash
eas build:configure
```

これにより`eas.json`ファイルが作成されます。

### APKビルド (Android端末に直接インストール)

#### ステップ1: APKをビルド

```bash
eas build --platform android --profile preview
```

初回は以下の質問があります:
- **Generate a new Android Keystore?**: `Yes`を選択
- その他はデフォルトでOK

ビルドには5〜20分程度かかります。

#### ステップ2: APKをダウンロード

ビルドが完了すると、ダウンロードリンクが表示されます。

```
✔ Build successful
https://expo.dev/accounts/[your-account]/projects/fragmenta/builds/[build-id]
```

#### ステップ3: Android端末にインストール

1. ブラウザでダウンロードリンクを開く
2. APKファイルをAndroid端末にダウンロード
3. Android端末で「提供元不明のアプリ」のインストールを許可
4. APKファイルをタップしてインストール

### AABビルド (Google Play配布用)

```bash
eas build --platform android --profile production
```

生成されたAABファイルをGoogle Play Consoleにアップロードします。

### EAS Buildの設定カスタマイズ

`eas.json`を編集して、ビルド設定をカスタマイズできます:

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

---

## 4. ローカルビルド

自分のPCでビルドする方法です。Android StudioとJDKが必要です。

### 事前準備

#### 必要な環境

- Android Studio
- JDK 17以上
- Android SDK
- Node.js 20.19.4以上

#### ステップ1: Android Studioのセットアップ

1. [Android Studio](https://developer.android.com/studio)をダウンロード・インストール
2. Android SDK Platform 34をインストール
3. Android SDK Build-Tools 34.0.0をインストール

#### ステップ2: 環境変数の設定

**macOS/Linux:**

`.bashrc`または`.zshrc`に追加:

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

**Windows:**

システム環境変数に追加:
```
ANDROID_HOME = C:\Users\[YourUsername]\AppData\Local\Android\Sdk
```

### ローカルビルド手順

#### ステップ1: プロジェクトをprebuild

```bash
npx expo prebuild --platform android
```

これにより`android`フォルダが生成されます。

#### ステップ2: APKをビルド

```bash
cd android
./gradlew assembleRelease
```

**Windows:**
```bash
cd android
gradlew.bat assembleRelease
```

#### ステップ3: APKの場所

ビルドが成功すると、以下の場所にAPKが生成されます:

```
android/app/build/outputs/apk/release/app-release.apk
```

#### ステップ4: APKに署名 (必須)

##### Keystoreの生成

```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore fragmenta-release-key.keystore \
  -alias fragmenta-key-alias \
  -keyalg RSA -keysize 2048 -validity 10000
```

以下の情報を入力:
- Keystore password: (任意のパスワード)
- 名前、組織名など

##### gradle.propertiesに設定を追加

`android/gradle.properties`に以下を追加:

```properties
MYAPP_RELEASE_STORE_FILE=fragmenta-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=fragmenta-key-alias
MYAPP_RELEASE_STORE_PASSWORD=****
MYAPP_RELEASE_KEY_PASSWORD=****
```

##### build.gradleを編集

`android/app/build.gradle`の`android`ブロック内に追加:

```gradle
signingConfigs {
    release {
        if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
            storeFile file(MYAPP_RELEASE_STORE_FILE)
            storePassword MYAPP_RELEASE_STORE_PASSWORD
            keyAlias MYAPP_RELEASE_KEY_ALIAS
            keyPassword MYAPP_RELEASE_KEY_PASSWORD
        }
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        // ...
    }
}
```

##### 再ビルド

```bash
cd android
./gradlew assembleRelease
```

#### ステップ5: Android端末にインストール

##### 方法1: USB経由

```bash
# 端末をUSBで接続し、USBデバッグを有効化
adb install android/app/build/outputs/apk/release/app-release.apk
```

##### 方法2: ファイル転送

1. APKファイルをAndroid端末に転送
2. 端末でAPKファイルをタップしてインストール

---

## 推奨される方法

### 開発・テスト段階
→ **Expo Go** (最も簡単)

### 配布前の確認
→ **EAS Build (APK)** (クラウドで簡単)

### Google Play配布
→ **EAS Build (AAB)** (公式ストア用)

### 完全なカスタマイズが必要
→ **ローカルビルド** (上級者向け)

---

## トラブルシューティング

### EAS Buildでエラーが出る

```bash
# キャッシュをクリア
eas build --platform android --profile preview --clear-cache
```

### ローカルビルドでGradleエラー

```bash
# Gradleキャッシュをクリア
cd android
./gradlew clean
./gradlew assembleRelease --stacktrace
```

### APKがインストールできない

1. 「提供元不明のアプリ」を許可しているか確認
2. 既存のアプリをアンインストールしてから再試行
3. 署名が正しく行われているか確認

### USB経由でインストールできない

```bash
# デバイスが認識されているか確認
adb devices

# 認識されない場合
adb kill-server
adb start-server
```

---

## セキュリティ注意事項

⚠️ **Keystoreファイルは厳重に管理してください**
- Gitにコミットしない (`.gitignore`に追加)
- バックアップを複数取る
- パスワードを安全に保管
- 紛失すると既存アプリの更新ができなくなります

---

## 参考リンク

- [Expo Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Build](https://docs.expo.dev/build/setup/)
- [Android Developer Guide](https://developer.android.com/studio/publish)
- [React Native Publishing](https://reactnative.dev/docs/signed-apk-android)

---

## まとめ

初めての場合は、**EAS Build**を使用することを強くお勧めします。環境構築の手間がなく、確実にビルドできます。

```bash
# クイックスタート (EAS Build)
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
```

これで、数分後にはAndroid端末にインストール可能なAPKが手に入ります!
