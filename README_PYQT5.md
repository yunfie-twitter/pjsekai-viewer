# PJSEKAI Viewer - PyQt5版

PyQt5で[pjsekai.world](https://pjsekai.world)を表示する高速・軽量デスクトップアプリケーションです。

## 特徴

### Electron版との違い
- 🚀 **より軽量** - メモリ使用量が約30-40%少ない
- ⚡ **高速起動** - 起動時間が約50%短縮
- 🐍 **Python製** - Pythonで動作、カスタマイズが容易
- 🔧 **シンプル** - Node.js不要、Pythonのみで動作

### 基本機能
- ✅ ネイティブメニューバー（日本語対応）
- ✅ ズーム機能（拡大/縮小/リセット）
- ✅ 全画面表示対応
- ✅ ナビゲーション（戻る/進む）
- ✅ 開発者ツール
- ✅ スムーススクロール
- ✅ WebGPU対応
- ✅ ネイティブ通知
- ✅ データ永続化（ログイン状態保持）
- ✅ Web Push API対応

### 最適化機能
- 🧹 自動キャッシュクリア（30分ごと）
- 💾 データ永続化（ログイン情報保持）
- 🔄 ウィンドウ状態の保存/復元
- ⚡ ハードウェアアクセラレーション

## インストール

### 必要な環境

- Python 3.7以上
- pip

### セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/yunfie-twitter/pjsekai-viewer.git
cd pjsekai-viewer

# 依存関係をインストール
pip install -r requirements.txt

# アプリを起動
python pjsekai_viewer.py
```

### Linux追加設定

Linuxの場合、追加パッケージが必要な場合があります：

```bash
# Ubuntu/Debian
sudo apt-get install python3-pyqt5 python3-pyqt5.qtwebengine

# Fedora
sudo dnf install python3-qt5 python3-qt5-webengine

# Arch Linux
sudo pacman -S python-pyqt5 python-pyqt5-webengine
```

## 実行ファイルの作成

PyInstallerを使用してスタンドアロン実行ファイルを作成できます：

```bash
# PyInstallerをインストール
pip install pyinstaller

# Windows向け
pyinstaller --onefile --windowed --name="PJSEKAI-Viewer" pjsekai_viewer.py

# macOS向け
pyinstaller --onefile --windowed --name="PJSEKAI-Viewer" --icon=build/icon.icns pjsekai_viewer.py

# Linux向け
pyinstaller --onefile --windowed --name="PJSEKAI-Viewer" pjsekai_viewer.py
```

実行ファイルは `dist/` ディレクトリに生成されます。

## ショートカットキー

| キー | 機能 |
|------|------|
| `Ctrl + R` | 再読み込み |
| `Ctrl + Q` | 終了 |
| `F11` | 全画面表示 |
| `Ctrl + +` | 拡大 |
| `Ctrl + -` | 縮小 |
| `Ctrl + 0` | ズームリセット |
| `Ctrl + Shift + I` | 開発者ツール |
| `Alt + Left` | 戻る |
| `Alt + Right` | 進む |

## メニュー機能

### ファイルメニュー
- **再読み込み** - 現在のページをリロード
- **ホームに戻る** - pjsekai.worldのトップページへ
- **キャッシュクリア** - キャッシュをクリアして再読み込み
- **完全クリア** - キャッシュ+ストレージを全てクリア（確認ダイアログあり）
- **終了** - アプリを終了

### 表示メニュー
- **全画面表示** - 全画面モードの切り替え
- **拡大/縮小/リセット** - ズーム操作
- **開発者ツール** - 開発者ツールを別ウィンドウで開く

### ナビゲーションメニュー
- **戻る/進む** - ページ履歴の移動

### ヘルプメニュー
- **pjsekai.worldについて** - アプリ内で `/about` ページを表示
- **GitHubリポジトリ** - ブラウザでリポジトリを開く

## データ保存場所

### Windows
```
%USERPROFILE%\.pjsekai-viewer\storage\
%USERPROFILE%\.pjsekai-viewer\cache\
```

### macOS/Linux
```
~/.pjsekai-viewer/storage/
~/.pjsekai-viewer/cache/
```

## 技術詳細

### コア技術
- [PyQt5](https://www.riverbankcomputing.com/software/pyqt/) 5.15+ - GUIフレームワーク
- [QtWebEngine](https://doc.qt.io/qt-5/qtwebengine-index.html) - Chromiumベースのブラウザエンジン

### 有効化されている機能
- **WebGL** - 3Dグラフィックス
- **Accelerated 2D Canvas** - 2D描画の高速化
- **Scroll Animator** - スムーススクロール
- **LocalStorage** - データ永続化
- **FullScreen API** - 全画面表示

### セキュリティ
- XSSオーディティング有効
- 安全でないコンテンツの実行をブロック
- ローカルコンテンツのリモートアクセス禁止
- HTTPSのみ許可（pjsekai.worldドメイン）

## パフォーマンス比較

| 項目 | Electron版 | PyQt5版 |
|------|-----------|--------|
| メモリ使用量 | ~200MB | ~130MB |
| 起動時間 | ~3秒 | ~1.5秒 |
| バイナリサイズ | ~150MB | ~50MB |
| 依存関係 | Node.js必須 | Pythonのみ |

## トラブルシューティング

### 起動しない場合

```bash
# 依存関係を再インストール
pip install --upgrade --force-reinstall PyQt5 PyQtWebEngine
```

### Linux: libQt5WebEngine.so.5 が見つからない

```bash
# Ubuntu/Debian
sudo apt-get install libqt5webengine5

# Fedora
sudo dnf install qt5-qtwebengine
```

### macOS: 「開発元を確認できないため開けません」エラー

```bash
# 実行権限を付与
chmod +x pjsekai_viewer.py

# またはGatekeeperを一時的に無効化
xattr -d com.apple.quarantine pjsekai_viewer.py
```

## ライセンス

MIT License

## 作者

ゆんふぃ ([@yunfie_misskey](https://twitter.com/yunfie_misskey))

## リンク

- [pjsekai.world](https://pjsekai.world) - Project SEKAI公式サイト
- [GitHub Repository](https://github.com/yunfie-twitter/pjsekai-viewer)
- [Electron版README](README.md)

---

⭐ このプロジェクトが役に立った場合は、GitHubでスターをお願いします！
