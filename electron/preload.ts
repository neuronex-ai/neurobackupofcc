import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  appVersion: process.env.npm_package_version || '1.0.0',
  isElectron: true,
  windowControls: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  },
  onMaximizeChange: (callback: (isMaximized: boolean) => void) => {
    ipcRenderer.on('window:maximized', (_event, value) => callback(Boolean(value)));
  },
  onNavigate: (callback: (path: string) => void) => {
    ipcRenderer.on('app:navigate', (_event, path) => callback(String(path || '/dashboard')));
  },
  notifications: {
    isSupported: () => ipcRenderer.invoke('notifications:isSupported'),
    requestPermission: () => ipcRenderer.invoke('notifications:requestPermission'),
    showNative: (payload: { title: string; body?: string; actionUrl?: string; notificationId?: string }) =>
      ipcRenderer.invoke('notifications:showNative', payload),
  },
  updater: {
    checkForUpdates: () => ipcRenderer.invoke('updater:checkForUpdates'),
    downloadUpdate: () => ipcRenderer.invoke('updater:downloadUpdate'),
    installUpdate: () => ipcRenderer.send('updater:installUpdate'),
    getVersion: () => ipcRenderer.invoke('updater:getVersion'),
    onStatus: (callback: (data: unknown) => void) => {
      ipcRenderer.on('updater:status', (_event, data) => callback(data));
    },
  },
  removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel),
});
