# PJSEKAI Viewer

Electronで[pjsekai.world](https://pjsekai.world)を表示するデスクトップアプリケーションです。

## 特徴

- シンプルで軽量なデスクトップアプリ
- ネイティブメニューバー対応
- ズーム機能
- 全画面表示対応
- 戻る/進むナビゲーション
- 開発者ツールアクセス

## インストール

### 必要な環境

- Node.js 18以上
- npm または yarn

### セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/yunfie-twitter/pjsekai-viewer.git
cd pjsekai-viewer

# 依存関係をインストール
npm install

# アプリを起動
npm start
```

## ビルド

各プラットフォーム向けの実行ファイルをビルドできます。

```bash
# Windows向け
npm run build:win

# macOS向け
npm run build:mac

# Linux向け
npm run build:linux

# すべてのプラットフォーム
npm run build
```

ビルドされたファイルは `dist/` ディレクトリに出力されます。

## ショートカットキー

| キー | 機能 |
|------|------|
| `Ctrl/Cmd + R` | 再読み込み |
| `Ctrl/Cmd + Q` | 終了 |
| `F11` | 全画面表示 |
| `Ctrl/Cmd + Plus` | 拡大 |
| `Ctrl/Cmd + -` | 縮小 |
| `Ctrl/Cmd + 0` | ズームリセット |
| `Ctrl/Cmd + Shift + I` | 開発者ツール |
| `Alt + Left` | 戻る |
| `Alt + Right` | 進む |

## 技術スタック

- [Electron](https://www.electronjs.org/) - クロスプラットフォームデスクトップアプリフレームワーク
- [electron-builder](https://www.electron.build/) - パッケージング・配布用ツール

## ライセンス

MIT License

## 作者

ゆんふぃ ([@yunfie_misskey](https://twitter.com/yunfie_misskey))

## リンク

- [GitHub Repository](https://github.com/yunfie-twitter/pjsekai-viewer)
