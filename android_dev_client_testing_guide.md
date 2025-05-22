# Android実機でのExpo Dev Clientテスト手順

Expo Dev Clientを使用してAndroid実機でアプリケーションをテストするための手順です。

## 1. 前提条件

- Expoプロジェクトがセットアップ済みであること。
- `expo-dev-client` パッケージがインストール済みであること (`npx expo install expo-dev-client`)。
- `app.json` に `developmentClient` の設定が追加済みであること。
  ```json
  {
    "expo": {
      // ...
      "developmentClient": {
        "silentLaunch": false
      },
      // ...
    }
  }
  ```
- Node.js と npm (または Yarn) がインストール済みであること。
- Android実機が利用可能で、USBデバッグが有効になっていること（ローカルビルドの場合）。
- 同じローカルネットワーク (Wi-Fi) に開発用PCとAndroid実機が接続されていること。

## 2. EAS Build を使用した開発ビルドの作成とインストール (推奨)

EAS Build を利用すると、クラウド上で開発ビルドを簡単に作成できます。

### 2.1. EAS CLIのインストールとログイン

まだインストールしていない場合は、EAS CLIをグローバルにインストールします。
```bash
npm install -g eas-cli
```

Expoアカウントでログインします。
```bash
eas login
```

### 2.2. ビルドプロファイルの設定 (`eas.json`)

プロジェクトルートに `eas.json` ファイルがない場合は作成します。
開発ビルド用のプロファイルを設定します。通常、`development` プロファイルがこれに該当します。

```json
{
  "cli": {
    "version": ">= 7.6.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "image": "latest" 
      }
    },
    "preview": {
      "distribution": "internal",
       "android": {
        "image": "latest"
      }
    },
    "production": {
       "android": {
        "image": "latest" 
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```
* `image` は使用するビルドイメージを指定します。`latest` は最新の安定版イメージを使用します。特定の Expo SDK バージョンに合わせたイメージ (例: `ubuntu-22.04-jdk-17-corretto-node-20-android-34`) を指定することもできます。詳細はExpoのドキュメントで確認してください。

### 2.3. 開発ビルドの開始

次のコマンドを実行して、Android用の開発ビルドを開始します。
```bash
eas build -p android --profile development
```
ビルドプロセスが開始され、進捗状況がターミナルに表示されます。ビルドには数分かかることがあります。

### 2.4. 開発ビルドのAndroid実機へのインストール

ビルドが完了すると、EASダッシュボード（Webサイト）にビルド成果物へのリンクまたはQRコードが表示されます。
1. Android実機でそのリンクを開くか、QRコードをスキャンします。
2. `.apk` ファイルがダウンロードされます。
3. ダウンロード後、ファイルマネージャーなどから `.apk` ファイルを開き、インストールします（提供元不明のアプリのインストールを許可する必要がある場合があります）。

## 3. 開発サーバーの起動

ローカルの開発マシンで、次のコマンドを実行して開発サーバーを起動します。
```bash
npx expo start --dev-client
```
または
```bash
expo start --dev-client
```
ターミナルにQRコードと開発サーバーのURLが表示されます。

## 4. 実機でのアプリ起動と接続

1. Android実機にインストールした開発ビルドのアプリ（アプリ名はプロジェクト名になります）を起動します。
2. アプリが起動すると、同じローカルネットワーク内の開発サーバーを自動的に検出しようとします。
3. うまく接続できない場合は、開発サーバーのターミナルに表示されているQRコードを実機のカメラやExpo Dev Clientアプリ内のスキャナで読み取るか、表示されているURL（例: `exp://<your-ip-address>:8081`）を手動で入力します。

## 5. 開発とデバッグ

- コードを変更すると、アプリは自動的にリロードされます。
- 通常のExpo開発と同様に、Chrome DevToolsなどを使用してデバッグが可能です。

## 補足: ローカルでの開発ビルド (上級者向け)

EAS Build を使わずにローカルマシンで開発ビルドを作成することも可能ですが、Android Studio、Java Development Kit (JDK)、Android SDK、NDKなどのネイティブ開発環境のセットアップが必要です。

環境が整っている場合、以下のコマンドでローカルビルドと実機へのインストールを試みることができます。
```bash
npx expo run:android
```
このコマンドは、接続されているAndroid実機または起動中のエミュレータを検出し、アプリをビルドしてインストールします。

---

このガイドが、Android実機でのExpo Dev Clientテストの一助となれば幸いです。 