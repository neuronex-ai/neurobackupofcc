import { app, BrowserWindow, ipcMain, Notification, shell } from 'electron';
import path from 'node:path';
import { autoUpdater } from 'electron-updater';

const isDev = !app.isPackaged;
const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:8080';
const windowsAppId = 'com.neuronex.desktop';

let mainWindow: BrowserWindow | null = null;

function emitUpdateStatus(data: Record<string, unknown>) {
  mainWindow?.webContents.send('updater:status', data);
}

function routeToHashPath(route: string) {
  const cleanRoute = route.startsWith('/') ? route : `/${route}`;
  return `#${cleanRoute}`;
}

function navigateTo(route?: string | null) {
  if (!route || !mainWindow) return;
  const cleanRoute = route.startsWith('/') ? route : `/${route}`;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
  mainWindow.webContents.send('app:navigate', cleanRoute);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 940,
    minWidth: 1120,
    minHeight: 720,
    frame: false,
    show: false,
    title: 'NeuroNex Desktop',
    backgroundColor: '#09090b',
    icon: path.join(process.cwd(), 'public', 'favicon-256px.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow?.show());
  mainWindow.on('maximize', () => mainWindow?.webContents.send('window:maximized', true));
  mainWindow.on('unmaximize', () => mainWindow?.webContents.send('window:maximized', false));
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      void shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  if (isDev) {
    void mainWindow.loadURL(devUrl);
  } else {
    void mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'), {
      hash: routeToHashPath('/dashboard').slice(1),
    });
  }
}

app.setAppUserModelId(windowsAppId);

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('window:minimize', () => mainWindow?.minimize());
ipcMain.on('window:maximize', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.on('window:close', () => mainWindow?.close());
ipcMain.handle('window:isMaximized', () => Boolean(mainWindow?.isMaximized()));

ipcMain.handle('notifications:isSupported', () => Notification.isSupported());
ipcMain.handle('notifications:requestPermission', () => (
  Notification.isSupported() ? 'granted' : 'denied'
));
ipcMain.handle('notifications:showNative', (_event, payload: {
  title?: string;
  body?: string;
  actionUrl?: string;
  notificationId?: string;
}) => {
  if (!Notification.isSupported()) {
    return { shown: false, reason: 'unsupported' };
  }

  const notification = new Notification({
    title: payload.title || 'NeuroNex',
    body: payload.body || 'Nova notificacao.',
    silent: false,
  });

  notification.on('click', () => navigateTo(payload.actionUrl || '/dashboard'));
  notification.show();
  return { shown: true, notificationId: payload.notificationId || null };
});

autoUpdater.autoDownload = false;
autoUpdater.on('checking-for-update', () => emitUpdateStatus({ status: 'checking' }));
autoUpdater.on('update-available', (info) => emitUpdateStatus({
  status: 'available',
  version: info.version,
  releaseNotes: info.releaseNotes,
  releaseDate: info.releaseDate,
}));
autoUpdater.on('update-not-available', () => emitUpdateStatus({ status: 'not-available' }));
autoUpdater.on('download-progress', (progress) => emitUpdateStatus({
  status: 'downloading',
  percent: progress.percent,
  bytesPerSecond: progress.bytesPerSecond,
  transferred: progress.transferred,
  total: progress.total,
}));
autoUpdater.on('update-downloaded', (info) => emitUpdateStatus({
  status: 'downloaded',
  version: info.version,
  releaseNotes: info.releaseNotes,
  releaseDate: info.releaseDate,
}));
autoUpdater.on('error', (error) => emitUpdateStatus({
  status: 'error',
  error: error.message,
}));

ipcMain.handle('updater:getVersion', () => app.getVersion());
ipcMain.handle('updater:checkForUpdates', async () => {
  if (isDev) return { status: 'not-available', version: app.getVersion() };
  try {
    await autoUpdater.checkForUpdates();
    return { status: 'checking' };
  } catch (error) {
    return { status: 'error', error: error instanceof Error ? error.message : 'Update check failed' };
  }
});
ipcMain.handle('updater:downloadUpdate', async () => {
  try {
    await autoUpdater.downloadUpdate();
    return { status: 'downloading' };
  } catch (error) {
    return { status: 'error', error: error instanceof Error ? error.message : 'Update download failed' };
  }
});
ipcMain.on('updater:installUpdate', () => autoUpdater.quitAndInstall(false, true));
