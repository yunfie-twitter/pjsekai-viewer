#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PJSEKAI Viewer - PyQt5 Version
https://pjsekai.world を表示するデスクトップアプリケーション
"""

import sys
import os
from PyQt5.QtCore import QUrl, Qt, QTimer, QSettings
from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QAction, QMessageBox,
    QWidget, QVBoxLayout
)
from PyQt5.QtWebEngineWidgets import (
    QWebEngineView, QWebEnginePage, QWebEngineProfile,
    QWebEngineSettings, QWebEngineNotification
)
from PyQt5.QtGui import QIcon


class CustomWebEnginePage(QWebEnginePage):
    """カスタムWebページクラス（新しいウィンドウ処理用）"""
    
    def __init__(self, profile, parent=None):
        super().__init__(profile, parent)
    
    def createWindow(self, window_type):
        """新しいウィンドウを開く処理"""
        # pjsekai.world内のリンクは同じウィンドウで開く
        return self
    
    def acceptNavigationRequest(self, url, nav_type, is_main_frame):
        """ナビゲーションリクエストの処理"""
        url_string = url.toString()
        
        # pjsekai.world内のリンクは許可
        if url_string.startswith('https://pjsekai.world'):
            return True
        
        # 外部リンクはデフォルトブラウザで開く
        if nav_type == QWebEnginePage.NavigationTypeLinkClicked:
            import webbrowser
            webbrowser.open(url_string)
            return False
        
        return True


class PJSEKAIViewer(QMainWindow):
    """メインウィンドウクラス"""
    
    def __init__(self):
        super().__init__()
        
        # 設定の読み込み
        self.settings = QSettings('yunfie', 'PJSEKAIViewer')
        
        # プロファイル設定（データ永続化）
        self.profile = QWebEngineProfile('pjsekai', self)
        self.profile.setPersistentStoragePath(
            os.path.join(os.path.expanduser('~'), '.pjsekai-viewer', 'storage')
        )
        self.profile.setCachePath(
            os.path.join(os.path.expanduser('~'), '.pjsekai-viewer', 'cache')
        )
        
        # WebEngine設定
        self.setup_webengine_settings()
        
        # UI初期化
        self.init_ui()
        
        # 通知ハンドラーの設定
        self.profile.setNotificationPresenter(self.handle_notification)
        
        # 定期キャッシュクリア（30分ごと）
        self.cache_timer = QTimer(self)
        self.cache_timer.timeout.connect(self.clear_cache_only)
        self.cache_timer.start(30 * 60 * 1000)  # 30分
    
    def setup_webengine_settings(self):
        """WebEngineの設定"""
        settings = self.profile.settings()
        
        # 基本設定
        settings.setAttribute(QWebEngineSettings.JavascriptEnabled, True)
        settings.setAttribute(QWebEngineSettings.LocalStorageEnabled, True)
        settings.setAttribute(QWebEngineSettings.PluginsEnabled, True)
        settings.setAttribute(QWebEngineSettings.FullScreenSupportEnabled, True)
        
        # パフォーマンス最適化
        settings.setAttribute(QWebEngineSettings.Accelerated2dCanvasEnabled, True)
        settings.setAttribute(QWebEngineSettings.WebGLEnabled, True)
        settings.setAttribute(QWebEngineSettings.ScrollAnimatorEnabled, True)
        
        # セキュリティ
        settings.setAttribute(QWebEngineSettings.LocalContentCanAccessRemoteUrls, False)
        settings.setAttribute(QWebEngineSettings.XSSAuditingEnabled, True)
        
        # 機能有効化
        settings.setAttribute(QWebEngineSettings.AllowRunningInsecureContent, False)
        settings.setAttribute(QWebEngineSettings.AllowGeolocationOnInsecureOrigins, False)
        
        # フォント設定
        settings.setFontFamily(QWebEngineSettings.StandardFont, 'sans-serif')
        settings.setFontSize(QWebEngineSettings.DefaultFontSize, 16)
    
    def init_ui(self):
        """UIの初期化"""
        self.setWindowTitle('PJSEKAI Viewer')
        self.setGeometry(100, 100, 1280, 800)
        
        # アイコン設定（存在する場合）
        icon_path = os.path.join(os.path.dirname(__file__), 'build', 'icon.png')
        if os.path.exists(icon_path):
            self.setWindowIcon(QIcon(icon_path))
        
        # 中央ウィジェット
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        # レイアウト
        layout = QVBoxLayout(central_widget)
        layout.setContentsMargins(0, 0, 0, 0)
        
        # WebEngineView
        self.web_view = QWebEngineView()
        self.web_page = CustomWebEnginePage(self.profile, self.web_view)
        self.web_view.setPage(self.web_page)
        
        layout.addWidget(self.web_view)
        
        # メニューバー作成
        self.create_menu_bar()
        
        # ウィンドウ状態の復元
        self.restore_window_state()
        
        # pjsekai.worldを読み込む
        self.web_view.setUrl(QUrl('https://pjsekai.world'))
        
        # スムーススクロールのCSS注入
        self.web_page.loadFinished.connect(self.inject_smooth_scroll)
    
    def inject_smooth_scroll(self):
        """スムーススクロールのCSS注入"""
        js_code = """
        (function() {
            const style = document.createElement('style');
            style.textContent = 'html { scroll-behavior: smooth !important; }';
            document.head.appendChild(style);
        })();
        """
        self.web_page.runJavaScript(js_code)
    
    def create_menu_bar(self):
        """メニューバーの作成"""
        menubar = self.menuBar()
        
        # ファイルメニュー
        file_menu = menubar.addMenu('ファイル(&F)')
        
        reload_action = QAction('再読み込み(&R)', self)
        reload_action.setShortcut('Ctrl+R')
        reload_action.triggered.connect(self.web_view.reload)
        file_menu.addAction(reload_action)
        
        home_action = QAction('ホームに戻る(&H)', self)
        home_action.triggered.connect(lambda: self.web_view.setUrl(QUrl('https://pjsekai.world')))
        file_menu.addAction(home_action)
        
        file_menu.addSeparator()
        
        cache_action = QAction('キャッシュクリア(&C)', self)
        cache_action.triggered.connect(self.clear_cache_and_reload)
        file_menu.addAction(cache_action)
        
        full_clear_action = QAction('完全クリア（注意：ログイン情報も削除）(&D)', self)
        full_clear_action.triggered.connect(self.full_clear_data)
        file_menu.addAction(full_clear_action)
        
        file_menu.addSeparator()
        
        quit_action = QAction('終了(&Q)', self)
        quit_action.setShortcut('Ctrl+Q')
        quit_action.triggered.connect(self.close)
        file_menu.addAction(quit_action)
        
        # 表示メニュー
        view_menu = menubar.addMenu('表示(&V)')
        
        fullscreen_action = QAction('全画面表示(&F)', self)
        fullscreen_action.setShortcut('F11')
        fullscreen_action.triggered.connect(self.toggle_fullscreen)
        view_menu.addAction(fullscreen_action)
        
        view_menu.addSeparator()
        
        zoom_in_action = QAction('拡大(&I)', self)
        zoom_in_action.setShortcut('Ctrl++')
        zoom_in_action.triggered.connect(lambda: self.change_zoom(0.1))
        view_menu.addAction(zoom_in_action)
        
        zoom_out_action = QAction('縮小(&O)', self)
        zoom_out_action.setShortcut('Ctrl+-')
        zoom_out_action.triggered.connect(lambda: self.change_zoom(-0.1))
        view_menu.addAction(zoom_out_action)
        
        zoom_reset_action = QAction('リセット(&R)', self)
        zoom_reset_action.setShortcut('Ctrl+0')
        zoom_reset_action.triggered.connect(lambda: self.web_view.setZoomFactor(1.0))
        view_menu.addAction(zoom_reset_action)
        
        view_menu.addSeparator()
        
        devtools_action = QAction('開発者ツール(&D)', self)
        devtools_action.setShortcut('Ctrl+Shift+I')
        devtools_action.triggered.connect(self.toggle_devtools)
        view_menu.addAction(devtools_action)
        
        # ナビゲーションメニュー
        nav_menu = menubar.addMenu('ナビゲーション(&N)')
        
        back_action = QAction('戻る(&B)', self)
        back_action.setShortcut('Alt+Left')
        back_action.triggered.connect(self.web_view.back)
        nav_menu.addAction(back_action)
        
        forward_action = QAction('進む(&F)', self)
        forward_action.setShortcut('Alt+Right')
        forward_action.triggered.connect(self.web_view.forward)
        nav_menu.addAction(forward_action)
        
        # ヘルプメニュー
        help_menu = menubar.addMenu('ヘルプ(&H)')
        
        about_action = QAction('pjsekai.worldについて(&A)', self)
        about_action.triggered.connect(lambda: self.web_view.setUrl(QUrl('https://pjsekai.world/about')))
        help_menu.addAction(about_action)
        
        help_menu.addSeparator()
        
        github_action = QAction('GitHubリポジトリ(&G)', self)
        github_action.triggered.connect(lambda: self.open_external('https://github.com/yunfie-twitter/pjsekai-viewer'))
        help_menu.addAction(github_action)
    
    def toggle_fullscreen(self):
        """全画面表示の切り替え"""
        if self.isFullScreen():
            self.showNormal()
        else:
            self.showFullScreen()
    
    def change_zoom(self, delta):
        """ズーム変更"""
        current_zoom = self.web_view.zoomFactor()
        new_zoom = max(0.25, min(5.0, current_zoom + delta))
        self.web_view.setZoomFactor(new_zoom)
    
    def toggle_devtools(self):
        """開発者ツールの切り替え"""
        if not hasattr(self, 'devtools_view') or not self.devtools_view:
            from PyQt5.QtWidgets import QDialog
            
            self.devtools_dialog = QDialog(self)
            self.devtools_dialog.setWindowTitle('DevTools - PJSEKAI Viewer')
            self.devtools_dialog.resize(1000, 700)
            
            layout = QVBoxLayout(self.devtools_dialog)
            layout.setContentsMargins(0, 0, 0, 0)
            
            self.devtools_view = QWebEngineView()
            self.web_page.setDevToolsPage(self.devtools_view.page())
            layout.addWidget(self.devtools_view)
            
            self.devtools_dialog.show()
        else:
            self.devtools_dialog.close()
            self.devtools_view = None
    
    def clear_cache_only(self):
        """キャッシュのみクリア（リロードしない）"""
        self.profile.clearHttpCache()
    
    def clear_cache_and_reload(self):
        """キャッシュクリアして再読み込み"""
        self.profile.clearHttpCache()
        self.web_view.reload()
    
    def full_clear_data(self):
        """完全データクリア（確認ダイアログ付き）"""
        reply = QMessageBox.warning(
            self,
            '完全クリア',
            '全てのデータ（ログイン情報、Cookie、キャッシュ）を削除します。\nよろしいですか？',
            QMessageBox.Yes | QMessageBox.Cancel,
            QMessageBox.Cancel
        )
        
        if reply == QMessageBox.Yes:
            self.profile.clearHttpCache()
            self.profile.clearAllVisitedLinks()
            
            # Cookieストアのクリア
            cookie_store = self.profile.cookieStore()
            cookie_store.deleteAllCookies()
            
            # ストレージクリア
            import shutil
            storage_path = os.path.join(os.path.expanduser('~'), '.pjsekai-viewer')
            if os.path.exists(storage_path):
                try:
                    shutil.rmtree(storage_path)
                except Exception as e:
                    print(f'Storage clear error: {e}')
            
            self.web_view.reload()
    
    def open_external(self, url):
        """外部ブラウザでURLを開く"""
        import webbrowser
        webbrowser.open(url)
    
    def handle_notification(self, notification):
        """ネイティブ通知の処理"""
        # PyQt5のシステムトレイ通知を使用
        try:
            from PyQt5.QtWidgets import QSystemTrayIcon
            if QSystemTrayIcon.isSystemTrayAvailable():
                if not hasattr(self, 'tray_icon'):
                    self.tray_icon = QSystemTrayIcon(self)
                    self.tray_icon.setIcon(self.windowIcon())
                
                self.tray_icon.showMessage(
                    notification.title(),
                    notification.message(),
                    QSystemTrayIcon.Information,
                    3000
                )
                
                # 通知を表示済みとしてマーク
                notification.show()
                notification.click.connect(lambda: self.activateWindow())
        except Exception as e:
            print(f'Notification error: {e}')
            notification.show()
    
    def restore_window_state(self):
        """ウィンドウ状態の復元"""
        geometry = self.settings.value('geometry')
        if geometry:
            self.restoreGeometry(geometry)
        
        state = self.settings.value('windowState')
        if state:
            self.restoreState(state)
    
    def closeEvent(self, event):
        """ウィンドウを閉じる時の処理"""
        # ウィンドウ状態を保存
        self.settings.setValue('geometry', self.saveGeometry())
        self.settings.setValue('windowState', self.saveState())
        
        # データは保持（クリアしない）
        event.accept()


def main():
    """メイン関数"""
    # High DPI対応
    QApplication.setAttribute(Qt.AA_EnableHighDpiScaling, True)
    QApplication.setAttribute(Qt.AA_UseHighDpiPixmaps, True)
    
    app = QApplication(sys.argv)
    app.setApplicationName('PJSEKAI Viewer')
    app.setOrganizationName('yunfie')
    
    viewer = PJSEKAIViewer()
    viewer.show()
    
    sys.exit(app.exec_())


if __name__ == '__main__':
    main()
