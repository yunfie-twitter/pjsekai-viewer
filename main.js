const { app, BrowserWindow, Menu, session, Notification } = require('electron');
const path = require('path');

let mainWindow;
let devToolsWindow = null;

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
      // 不要な機能を無効化
      enableWebSQL: false,
      nodeIntegrationInWorker: false,
      nodeIntegrationInSubFrames: false,
      // V8のメモリ最適化
      v8CacheOptions: 'code',
      // パフォーマンス最適化
      spellcheck: false,
      // WebGPUサポートを有効化
      enableBlinkFeatures: 'WebGPU',
      // 不要な機能を無効化
      disableBlinkFeatures: 'AutomationControlled',
      // ハードウェアアクセラレーション有効
      enablePreferredSizeMode: false,
      // データ永続化のためにpartitionを設定
      partition: 'persist:pjsekai'
    },
    icon: path.join(__dirname, 'build/icon.png'),
    // ウィンドウの最適化
    show: false,
    backgroundColor: '#000000'
  });

  // pjsekai.worldを読み込む
  mainWindow.loadURL('https://pjsekai.world');

  // ページ読み込み完了後に表示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // スムーススクロールのみ有効化（スクロールバーCSSはサイトのものを使用）
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.insertCSS(`
      html {
        scroll-behavior: smooth !important;
      }
    `);
  });

  // メモリ最適化：定期的なキャッシュクリア（30分ごと）
  // リロードを行わないように修正
  const cacheCleanupInterval = setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      // キャッシュクリアのみでリロードしない
      mainWindow.webContents.session.clearCache().catch(err => {
        console.error('Cache clear error:', err);
      });
    }
  }, 30 * 60 * 1000);

  // ウィンドウ閉じるときにインターバルをクリア
  mainWindow.on('closed', () => {
    clearInterval(cacheCleanupInterval);
    if (devToolsWindow && !devToolsWindow.isDestroyed()) {
      devToolsWindow.close();
    }
    mainWindow = null;
  });

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
            }).catch(err => {
              console.error('Cache clear error:', err);
              mainWindow.reload();
            });
          }
        },
        {
          label: '完全クリア（注意：ログイン情報も削除）',
          click: () => {
            const response = require('electron').dialog.showMessageBoxSync(mainWindow, {
              type: 'warning',
              buttons: ['キャンセル', '実行'],
              defaultId: 0,
              title: '完全クリア',
              message: '全てのデータ（ログイン情報、Cookie、キャッシュ）を削除します。\nよろしいですか？'
            });
            
            if (response === 1) {
              Promise.all([
                mainWindow.webContents.session.clearCache(),
                mainWindow.webContents.session.clearStorageData()
              ]).then(() => {
                mainWindow.reload();
              }).catch(err => {
                console.error('Full clear error:', err);
                mainWindow.reload();
              });
            }
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
          label: '開発者ツール（別ウィンドウ）',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => {
            openDevToolsWindow();
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
            mainWindow.loadURL('https://pjsekai.world/about');
          }
        },
        { type: 'separator' },
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

  // 新しいウィンドウを開くリンクの処理
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://pjsekai.world')) {
      mainWindow.loadURL(url);
      return { action: 'deny' };
    }
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });

  // レンダラープロセスクラッシュ時のみリカバリ（謎のリロードを防止）
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('Renderer process gone:', details);
    if (details.reason === 'crashed' || details.reason === 'oom' || details.reason === 'launch-failed') {
      console.log('Critical error, reloading...');
      mainWindow.reload();
    }
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Page load failed:', errorCode, errorDescription);
  });
}

// 開発者ツールを別ウィンドウで開く関数
function openDevToolsWindow() {
  if (devToolsWindow && !devToolsWindow.isDestroyed()) {
    devToolsWindow.focus();
    return;
  }

  devToolsWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    title: 'DevTools - PJSEKAI Viewer',
    show: false
  });

  mainWindow.webContents.setDevToolsWebContents(devToolsWindow.webContents);
  mainWindow.webContents.openDevTools({ mode: 'detach' });

  devToolsWindow.once('ready-to-show', () => {
    devToolsWindow.show();
  });

  devToolsWindow.on('closed', () => {
    devToolsWindow = null;
  });
}

// アプリケーション起動時のコマンドラインスイッチ
app.commandLine.appendSwitch('disable-features', [
  'CalculateNativeWinOcclusion',
  'MediaRouter',
  'AudioServiceOutOfProcess',
  'HeavyAdIntervention',
  'IdleDetection'
].join(','));

app.commandLine.appendSwitch('enable-features', [
  'Vulkan',
  'WebGPU',
  'WebGPUService',
  'PushMessaging',
  'Notifications',
  'SmoothScrolling'
].join(','));

app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=512');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('disable-dev-shm-usage');
app.commandLine.appendSwitch('webauthn-timeout', '30000');

// セッション設定
app.whenReady().then(() => {
  const ses = session.fromPartition('persist:pjsekai');

  ses.setUserAgent(ses.getUserAgent());

  ses.protocol.interceptFileProtocol('file', (request, callback) => {
    callback({ error: -3 });
  });

  // パーミッションリクエストの処理
  ses.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = ['notifications', 'media', 'fullscreen', 'push'];
    callback(allowedPermissions.includes(permission));
  });

  ses.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
    if (requestingOrigin.startsWith('https://pjsekai.world')) {
      const allowedPermissions = ['notifications', 'media', 'fullscreen', 'push'];
      return allowedPermissions.includes(permission);
    }
    return false;
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 終了時にデータを保持（クリアしない）
app.on('before-quit', () => {
  // データを保持するため、クリア処理を削除
  console.log('App closing, preserving data...');
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled promise rejection:', reason);
});
