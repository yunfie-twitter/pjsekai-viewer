const { app, BrowserWindow, Menu, session } = require('electron');
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
      spellcheck: false, // スペルチェック無効化
      // WebGPUサポートを有効化
      enableBlinkFeatures: 'WebGPU',
      // 不要な機能を無効化
      disableBlinkFeatures: 'AutomationControlled',
      // ハードウェアアクセラレーション有効（WebGPU用）
      enablePreferredSizeMode: false
    },
    icon: path.join(__dirname, 'build/icon.png'),
    // ウィンドウの最適化
    show: false, // 準備完了後に表示
    // 背景色を設定してちらつきを防止
    backgroundColor: '#000000'
  });

  // pjsekai.worldを読み込む
  mainWindow.loadURL('https://pjsekai.world');

  // ページ読み込み完了後に表示（ちらつき防止）
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // スムーススクロールの有効化（CSSを注入）
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.insertCSS(`
      * {
        scroll-behavior: smooth !important;
      }
      html {
        scroll-behavior: smooth !important;
      }
    `);
  });

  // メモリ最適化：定期的なキャッシュクリア（30分ごと）
  const cacheCleanupInterval = setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.session.clearCache().catch(err => {
        console.error('Cache clear error:', err);
      });
    }
  }, 30 * 60 * 1000);

  // ウィンドウ閉じるときにインターバルをクリア
  mainWindow.on('closed', () => {
    clearInterval(cacheCleanupInterval);
    // DevToolsウィンドウも閉じる
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
          label: '完全クリア（キャッシュ+ストレージ）',
          click: () => {
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
            // アプリ内で /about ページを開く
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
    // pjsekai.world内のリンクはアプリ内で開く
    if (url.startsWith('https://pjsekai.world')) {
      mainWindow.loadURL(url);
      return { action: 'deny' };
    }
    // 外部リンクはブラウザで開く
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });

  // メムリリーク防止：レンダラープロセスクラッシュ時の自動リカバリ
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('Renderer process gone:', details);
    if (details.reason !== 'clean-exit') {
      console.log('Attempting to reload...');
      mainWindow.reload();
    }
  });

  // メモリ警告のログ
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
// 不要な機能を無効化
app.commandLine.appendSwitch('disable-features', [
  'CalculateNativeWinOcclusion',
  'MediaRouter', // Chromecast等のメディアルーター
  'AudioServiceOutOfProcess', // オーディオサービスの分離プロセス
  'HeavyAdIntervention', // 広告制御
  'IdleDetection' // アイドル検出
].join(','));

// WebGPUとWeb Push API、スムーススクロールを有効化
app.commandLine.appendSwitch('enable-features', [
  'Vulkan', // Vulkanサポート
  'WebGPU', // WebGPUサポート
  'WebGPUService', // WebGPUサービス
  'PushMessaging', // Web Push API
  'Notifications', // 通知API
  'SmoothScrolling' // スムーススクロール
].join(','));

// ハードウェアアクセラレーションを有効に保つ（WebGPU用）
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');

// V8メモリ制限（JavaScriptヒープ）
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=512');

// レンダリング最適化
app.commandLine.appendSwitch('disable-software-rasterizer'); // ソフトウェアレンダラー無効
app.commandLine.appendSwitch('disable-dev-shm-usage'); // /dev/shm使用を無効化

// WebAuthn高速化：タイムアウトを短くしてレスポンス時間を改善
app.commandLine.appendSwitch('webauthn-timeout', '30000'); // 30秒（デフォルトより短い）

// セッション設定
app.whenReady().then(() => {
  // User Agentの設定
  session.defaultSession.setUserAgent(
    session.defaultSession.getUserAgent()
  );

  // 不要なプロトコルインターセプターを設定
  session.defaultSession.protocol.interceptFileProtocol('file', (request, callback) => {
    callback({ error: -3 }); // ファイルプロトコルをブロック
  });

  // パーミッションリクエストの処理（Web Push APIを含む）
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = [
      'notifications', // 通知
      'media', // メディア
      'fullscreen', // 全画面
      'push' // Web Push API
    ];
    callback(allowedPermissions.includes(permission));
  });

  // パーミッションチェックの処理
  session.defaultSession.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
    // pjsekai.worldのみ許可
    if (requestingOrigin.startsWith('https://pjsekai.world')) {
      const allowedPermissions = ['notifications', 'media', 'fullscreen', 'push'];
      return allowedPermissions.includes(permission);
    }
    return false;
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

// アプリ終了前のクリーンアップ
app.on('before-quit', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    Promise.all([
      mainWindow.webContents.session.clearCache(),
      mainWindow.webContents.session.clearStorageData()
    ]).catch(err => {
      console.error('Cleanup error:', err);
    });
  }
});

// エラーハンドラー
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled promise rejection:', reason);
});
