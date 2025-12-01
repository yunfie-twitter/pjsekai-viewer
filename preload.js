// Preload script
// セキュリティのためのコンテキスト分離

const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
  console.log('PJSEKAI Viewer loaded');

  // Web通知をネイティブ通知に置き換え
  const originalNotification = window.Notification;
  
  // Notification APIをオーバーライド
  window.Notification = class extends originalNotification {
    constructor(title, options) {
      super(title, options);
      
      // Electronのネイティブ通知を使用
      try {
        const { Notification: ElectronNotification } = require('electron').remote || require('@electron/remote');
        if (ElectronNotification && ElectronNotification.isSupported()) {
          const notification = new ElectronNotification({
            title: title,
            body: options?.body || '',
            icon: options?.icon,
            silent: options?.silent || false,
            urgency: 'normal'
          });
          
          notification.show();
          
          // クリックイベントを伝播
          notification.on('click', () => {
            if (this.onclick) {
              this.onclick();
            }
          });
        }
      } catch (err) {
        console.error('Native notification error:', err);
        // フォールバックとしてWeb通知を使用
      }
    }
  };
  
  // Notification.permissionを保持
  Object.defineProperty(window.Notification, 'permission', {
    get: () => originalNotification.permission
  });
  
  // Notification.requestPermissionを保持
  window.Notification.requestPermission = originalNotification.requestPermission.bind(originalNotification);
});
