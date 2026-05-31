import { app, BrowserWindow, Menu, ipcMain, shell, dialog, session } from 'electron';
import { autoUpdater, UpdateInfo } from 'electron-updater';
import path from 'path';

// Disable hardware acceleration for better compatibility on some GPUs
app.disableHardwareAcceleration();

const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;

// ─── Auto-Updater Configuration ───────────────────────────────────────
function setupAutoUpdater() {
    // Configure auto-updater
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowPrerelease = false;

    // Log updater events
    autoUpdater.logger = {
        info: (message: any) => console.log('[AutoUpdater]', message),
        warn: (message: any) => console.warn('[AutoUpdater]', message),
        error: (message: any) => console.error('[AutoUpdater]', message),
        debug: (message: any) => console.log('[AutoUpdater:debug]', message),
    };

    // ─── Updater Events → Renderer ────────────────────────────────────
    autoUpdater.on('checking-for-update', () => {
        console.log('[AutoUpdater] Checking for updates...');
        mainWindow?.webContents.send('updater:status', {
            status: 'checking',
        });
    });

    autoUpdater.on('update-available', (info: UpdateInfo) => {
        console.log('[AutoUpdater] Update available:', info.version);
        mainWindow?.webContents.send('updater:status', {
            status: 'available',
            version: info.version,
            releaseNotes: info.releaseNotes,
            releaseDate: info.releaseDate,
        });
    });

    autoUpdater.on('update-not-available', (info: UpdateInfo) => {
        console.log('[AutoUpdater] No update available. Current:', app.getVersion());
        mainWindow?.webContents.send('updater:status', {
            status: 'not-available',
            version: info.version,
        });
    });

    autoUpdater.on('download-progress', (progress: any) => {
        console.log(`[AutoUpdater] Download progress: ${Math.round(progress.percent)}%`);
        mainWindow?.webContents.send('updater:status', {
            status: 'downloading',
            percent: progress.percent,
            bytesPerSecond: progress.bytesPerSecond,
            transferred: progress.transferred,
            total: progress.total,
        });
    });

    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
        console.log('[AutoUpdater] Update downloaded:', info.version);
        mainWindow?.webContents.send('updater:status', {
            status: 'downloaded',
            version: info.version,
            releaseNotes: info.releaseNotes,
        });
    });

    autoUpdater.on('error', (error: Error) => {
        console.error('[AutoUpdater] Error:', error.message);
        mainWindow?.webContents.send('updater:status', {
            status: 'error',
            error: error.message,
        });
    });
}

// ─── IPC Handlers for Auto-Updater ────────────────────────────────────
ipcMain.handle('updater:check', async () => {
    if (isDev) {
        // In dev, simulate "no update" so UI can be tested
        mainWindow?.webContents.send('updater:status', {
            status: 'not-available',
            version: app.getVersion(),
        });
        return { status: 'dev-mode' };
    }
    try {
        const result = await autoUpdater.checkForUpdates();
        return { status: 'ok', version: result?.updateInfo?.version };
    } catch (err: any) {
        return { status: 'error', error: err.message };
    }
});

ipcMain.handle('updater:download', async () => {
    try {
        await autoUpdater.downloadUpdate();
        return { status: 'ok' };
    } catch (err: any) {
        return { status: 'error', error: err.message };
    }
});

ipcMain.on('updater:install', () => {
    autoUpdater.quitAndInstall(false, true);
});

ipcMain.handle('updater:getVersion', () => {
    return app.getVersion();
});

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1366,
        height: 900,
        minWidth: 1024,
        minHeight: 700,
        frame: false,
        titleBarStyle: 'hidden',
        backgroundColor: '#0A0A0B',
        show: false,
        icon: isDev
            ? path.join(__dirname, '../build/icon.ico')
            : path.join(process.resourcesPath, 'icon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false,
            // sandbox must be false so preload can access process.platform, process.env
            sandbox: false,
            // webSecurity must be false for file:// protocol to load local assets
            webSecurity: false,
        },
    });

    // Graceful show when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
        if (isDev) {
            mainWindow?.webContents.openDevTools({ mode: 'detach' });
        }

        // Check for updates after window is shown (with delay to not block UI)
        if (!isDev) {
            setTimeout(() => {
                autoUpdater.checkForUpdates().catch((err) => {
                    console.error('[AutoUpdater] Initial check failed:', err);
                });
            }, 5000);
        }
    });

    // Log all console messages from the renderer for debugging
    mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
        console.log(`[Renderer] [${level}] ${message} (${sourceId}:${line})`);
    });

    // Load the app
    if (isDev) {
        mainWindow.loadURL('http://localhost:8080');
    } else {
        // Robust path resolution for production
        const indexPath = path.join(__dirname, '../dist/index.html');

        console.log('[NeuroNex] Starting in PRODUCTION mode');
        console.log('[NeuroNex] Loading UI from:', indexPath);

        mainWindow.loadFile(indexPath).catch((err) => {
            console.error('[NeuroNex] CRITICAL FAILURE: Failed to load index.html');
            console.error('[NeuroNex] Error details:', err);

            // Show error dialog to user if loading fails
            dialog.showErrorBox(
                'Erro de Inicialização',
                `Falha ao carregar a interface do aplicativo.\n\nDetalhes: ${err.message || err}`
            );
        });
    }

    // Log renderer errors for debugging
    mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
        console.error(`[NeuroNex] Page failed to load: ${errorDescription} (code: ${errorCode}) URL: ${validatedURL}`);
    });

    mainWindow.webContents.on('render-process-gone', (_event, details) => {
        console.error('[NeuroNex] Render process gone:', details.reason);
    });

    // Open external links in the default browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http')) {
            shell.openExternal(url);
        }
        return { action: 'deny' };
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// ─── IPC Handlers for Window Controls ──────────────────────────────────
ipcMain.on('window:minimize', () => mainWindow?.minimize());
ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow?.maximize();
    }
});
ipcMain.on('window:close', () => mainWindow?.close());
ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized());

// Listen for maximize/unmaximize to update the renderer
ipcMain.on('window:onMaximizeChange', (event) => {
    mainWindow?.on('maximize', () => event.sender.send('window:maximized', true));
    mainWindow?.on('unmaximize', () => event.sender.send('window:maximized', false));
});

// ─── Custom Application Menu ───────────────────────────────────────────
function createMenu() {
    const template: Electron.MenuItemConstructorOptions[] = [
        {
            label: 'NeuroNex',
            submenu: [
                {
                    label: 'Sobre o NeuroNex Desktop',
                    click: () => {
                        dialog.showMessageBox({
                            type: 'info',
                            title: 'NeuroNex Desktop',
                            message: 'NeuroNex Desktop',
                            detail: `Versão: ${app.getVersion()}\nGestão Inteligente para Psicólogos\n\n© ${new Date().getFullYear()} NeuroNex. Todos os direitos reservados.`,
                            buttons: ['OK'],
                        });
                    },
                },
                { type: 'separator' },
                {
                    label: 'Verificar Atualizações...',
                    click: () => {
                        if (isDev) {
                            dialog.showMessageBox({
                                type: 'info',
                                title: 'Atualizações',
                                message: 'Modo de desenvolvimento',
                                detail: 'As atualizações automáticas só funcionam em produção.',
                                buttons: ['OK'],
                            });
                            return;
                        }
                        autoUpdater.checkForUpdates().catch((err) => {
                            console.error('[AutoUpdater] Manual check failed:', err);
                        });
                    },
                },
                { type: 'separator' },
                {
                    label: 'Sair',
                    accelerator: 'Alt+F4',
                    click: () => app.quit(),
                },
            ],
        },
        {
            label: 'Editar',
            submenu: [
                { label: 'Desfazer', role: 'undo' },
                { label: 'Refazer', role: 'redo' },
                { type: 'separator' },
                { label: 'Recortar', role: 'cut' },
                { label: 'Copiar', role: 'copy' },
                { label: 'Colar', role: 'paste' },
                { label: 'Selecionar Tudo', role: 'selectAll' },
            ],
        },
        {
            label: 'Visualizar',
            submenu: [
                { label: 'Recarregar', role: 'reload' },
                { label: 'Forçar Recarregamento', role: 'forceReload' },
                { type: 'separator' },
                { label: 'Tela Cheia', role: 'togglefullscreen' },
                { type: 'separator' },
                { label: 'Aumentar Zoom', role: 'zoomIn' },
                { label: 'Diminuir Zoom', role: 'zoomOut' },
                { label: 'Zoom Padrão', role: 'resetZoom' },
            ],
        },
        {
            label: 'Ajuda',
            submenu: [
                {
                    label: 'Central de Ajuda',
                    click: () => {
                        mainWindow?.webContents.send('navigate', '/help');
                    },
                },
                { type: 'separator' },
                {
                    label: 'Site do NeuroNex',
                    click: () => shell.openExternal('https://neuronex.site'),
                },
                {
                    label: 'Reportar Problema',
                    click: () => shell.openExternal('https://neuronex.site/contact'),
                },
            ],
        },
    ];

    // Add DevTools in development
    if (isDev) {
        (template[2].submenu as Electron.MenuItemConstructorOptions[]).push(
            { type: 'separator' },
            { label: 'DevTools', role: 'toggleDevTools' }
        );
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// ─── Single Instance Lock ──────────────────────────────────────────────
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });

    app.whenReady().then(() => {
        setupAutoUpdater();
        createMenu();
        createWindow();
    });
}

// ─── App Lifecycle ─────────────────────────────────────────────────────
app.on('window-all-closed', () => {
    app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
