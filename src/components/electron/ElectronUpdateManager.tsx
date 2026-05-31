import { isElectron } from '@/lib/electron';
import { useAppUpdate } from '@/hooks/use-app-update';
import { UpdateModal } from './UpdateModal';

/**
 * ElectronUpdateManager — Manages the auto-update lifecycle for the Electron app.
 * Renders the UpdateModal when a new version is available or downloaded.
 * Only renders inside Electron.
 */
export const ElectronUpdateManager = () => {
    const {
        status,
        updateVersion,
        currentVersion,
        downloadPercent,
        releaseNotes,
        showModal,
        downloadUpdate,
        installUpdate,
        dismissModal,
    } = useAppUpdate();

    if (!isElectron()) return null;

    return (
        <UpdateModal
            isOpen={showModal}
            status={status}
            version={updateVersion}
            currentVersion={currentVersion}
            downloadPercent={downloadPercent}
            releaseNotes={releaseNotes}
            onDismiss={dismissModal}
            onDownload={downloadUpdate}
            onInstall={installUpdate}
        />
    );
};
