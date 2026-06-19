/**
 * Electron Environment Detection & Auto-Updater Types
 * Detects whether the app is running inside Electron or in a standard browser.
 */

export type UpdateStatus =
    | 'idle'
    | 'checking'
    | 'available'
    | 'not-available'
    | 'downloading'
    | 'downloaded'
    | 'error';

export interface UpdateStatusData {
    status: UpdateStatus;
    version?: string;
    releaseNotes?: string | { version: string; note: string }[];
    releaseDate?: string;
    percent?: number;
    bytesPerSecond?: number;
    transferred?: number;
    total?: number;
    error?: string;
}

interface ElectronUpdaterAPI {
    checkForUpdates: () => Promise<{ status: string; version?: string; error?: string }>;
    downloadUpdate: () => Promise<{ status: string; error?: string }>;
    installUpdate: () => void;
    getVersion: () => Promise<string>;
    onStatus: (callback: (data: UpdateStatusData) => void) => void;
}

interface ElectronNotificationsAPI {
    isSupported: () => Promise<boolean>;
    requestPermission: () => Promise<'granted' | 'denied'>;
    showNative: (payload: {
        title: string;
        body?: string;
        actionUrl?: string;
        notificationId?: string;
    }) => Promise<{ shown: boolean; reason?: string; notificationId?: string | null }>;
}

interface ElectronAPI {
    platform: string;
    appVersion: string;
    isElectron: boolean;
    windowControls: {
        minimize: () => void;
        maximize: () => void;
        close: () => void;
        isMaximized: () => Promise<boolean>;
    };
    onMaximizeChange: (callback: (isMaximized: boolean) => void) => void;
    onNavigate: (callback: (path: string) => void) => void;
    notifications: ElectronNotificationsAPI;
    updater: ElectronUpdaterAPI;
    removeAllListeners: (channel: string) => void;
}

declare global {
    interface Window {
        electronAPI?: ElectronAPI;
    }
}

/** Returns `true` when running inside Electron */
export const isElectron = (): boolean => {
    return !!(window as any).electronAPI?.isElectron;
};

/** Get the Electron API (only available inside Electron) */
export const getElectronAPI = (): ElectronAPI | undefined => {
    return window.electronAPI;
};

/** Get platform string (win32, darwin, linux) */
export const getElectronPlatform = (): string | undefined => {
    return window.electronAPI?.platform;
};

/** Get app version */
export const getElectronAppVersion = (): string | undefined => {
    return window.electronAPI?.appVersion;
};
