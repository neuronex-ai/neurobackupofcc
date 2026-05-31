import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    // ─── Platform Info ─────────────────────────────────────────────────
    platform: process.platform,
    appVersion: process.env.npm_package_version || '1.0.0',
    isElectron: true,

    // ─── Window Controls ──────────────────────────────────────────────
    windowControls: {
        minimize: () => ipcRenderer.send('window:minimize'),
        maximize: () => ipcRenderer.send('window:maximize'),
        close: () => ipcRenderer.send('window:close'),
        isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
    },

    // ─── Window State Listeners ───────────────────────────────────────
    onMaximizeChange: (callback: (isMaximized: boolean) => void) => {
        ipcRenderer.send('window:onMaximizeChange');
        ipcRenderer.on('window:maximized', (_event, value: boolean) => callback(value));
    },

    // ─── Navigation (from menu) ───────────────────────────────────────
    onNavigate: (callback: (path: string) => void) => {
        ipcRenderer.on('navigate', (_event, path: string) => callback(path));
    },

    // ─── Auto-Updater ─────────────────────────────────────────────────
    updater: {
        checkForUpdates: () => ipcRenderer.invoke('updater:check'),
        downloadUpdate: () => ipcRenderer.invoke('updater:download'),
        installUpdate: () => ipcRenderer.send('updater:install'),
        getVersion: () => ipcRenderer.invoke('updater:getVersion'),
        onStatus: (callback: (data: any) => void) => {
            ipcRenderer.on('updater:status', (_event, data) => callback(data));
        },
    },

    // ─── Cleanup ──────────────────────────────────────────────────────
    removeAllListeners: (channel: string) => {
        ipcRenderer.removeAllListeners(channel);
    },
});
