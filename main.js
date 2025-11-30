const { app, BrowserWindow, Menu, session } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'PJSEKAI Viewer',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      // メモリ最適化設定
      backgroundThrottling: true,
      // ハードウェアアクセラレーション有効化（GPU使用でメモリ効率化）
      enableWebSQL: false,
      // 不要な機能を無効化
      nodeIntegrationInWorker: false,
      nodeIntegrationInSubFrames: false,
      // V8のメモリ制限
      v8CacheOptions: 'code'
    },
    icon: path.join(__dirname, 'build/icon.png'),
    // ウィンドウの最適化
    show: false // 準備完了後に表示
  });

  // pjsekai.worldを読み込む
  mainWindow.loadURL('https://pjsekai.world');

  // ページ読み込み完了後に表示（ちらつき防止）
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // メモリ最適化：定期的なガベージコレクション
  setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.session.clearCache();
    }
  }, 30 * 60 * 1000); // 30分ごと

  // メニューバーを作成
  const template = [
    {
      label: 'ファイル',
      submenu: [
        {
          label: '再読み込み',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.reload();
          }
        },
        {
          label: 'ホームに戻る',
          click: () => {
            mainWindow.loadURL('https://pjsekai.world');
          }
        },
        { type: 'separator' },
        {
          label: 'キャッシュクリア',
          click: () => {
            mainWindow.webContents.session.clearCache().then(() => {
              mainWindow.reload();
            });
          }
        },
        { type: 'separator' },
        {
          label: '終了',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: '表示',
      submenu: [
        {
          label: '全画面表示',
          accelerator: 'F11',
          click: () => {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
          }
        },
        { type: 'separator' },
        {
          label: '拡大',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomLevel();
            mainWindow.webContents.setZoomLevel(currentZoom + 0.5);
          }
        },
        {
          label: '縮小',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomLevel();
            mainWindow.webContents.setZoomLevel(currentZoom - 0.5);
          }
        },
        {
          label: 'リセット',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            mainWindow.webContents.setZoomLevel(0);
          }
        },
        { type: 'separator' },
        {
          label: '開発者ツール',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        }
      ]
    },
    {
      label: 'ナビゲーション',
      submenu: [
        {
          label: '戻る',
          accelerator: 'Alt+Left',
          click: () => {
            if (mainWindow.webContents.canGoBack()) {
              mainWindow.webContents.goBack();
            }
          }
        },
        {
          label: '進む',
          accelerator: 'Alt+Right',
          click: () => {
            if (mainWindow.webContents.canGoForward()) {
              mainWindow.webContents.goForward();
            }
          }
        }
      ]
    },
    {
      label: 'ヘルプ',
      submenu: [
        {
          label: 'pjsekai.worldについて',
          click: () => {
            // アプリ内で /about ページを開く
            mainWindow.loadURL('https://pjsekai.world/about');
          }
        },
        {
          label: 'GitHubリポジトリ',
          click: () => {
            require('electron').shell.openExternal('https://github.com/yunfie-twitter/pjsekai-viewer');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // ウィンドウが閉じられたときの処理
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 新しいウィンドウを開くリンクはデフォルトのブラウザで開く
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // pjsekai.world内のリンクはアプリ内で開く
    if (url.startsWith('https://pjsekai.world')) {
      mainWindow.loadURL(url);
      return { action: 'deny' };
    }
    // 外部リンクはブラウザで開く
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });

  // メモリリーク防止：長時間のレンダラープロセス最適化
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.log('Renderer process gone:', details);
    if (details.reason !== 'clean-exit') {
      mainWindow.reload();
    }
  });
}

// アプリケーション起動時の最適化
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
app.commandLine.appendSwitch('disable-gpu-compositing'); // GPU合成を無効化してメモリ削減（必要に応じて）
// メモリ使用量を制限（オプション）
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=512');

// セッション最適化
app.whenReady().then(() => {
  // キャッシュサイズを制限
  session.defaultSession.setCache({
    maxSize: 50 * 1024 * 1024 // 50MB
  });

  // 不要なプロトコルを無効化
  session.defaultSession.protocol.interceptFileProtocol('file', (request, callback) => {
    callback({ error: -3 }); // ファイルプロトコルを無効化
  });

  createWindow();

  app.on('activate', () => {
    // macOSでDockアイコンがクリックされたときの処理
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// すべてのウィンドウが閉じられたときの処理
app.on('window-all-closed', () => {
  // macOS以外ではアプリケーションを終了
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// アプリ終了前にキャッシュクリア
app.on('before-quit', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.session.clearCache();
    mainWindow.webContents.session.clearStorageData();
  }
});
