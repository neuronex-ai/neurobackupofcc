import { useState, useEffect } from 'react';
import { Minus, Square, X, Copy, ArrowUpCircle, Loader2, Check, Download } from 'lucide-react';
import { getElectronAPI, isElectron } from '@/lib/electron';
import { useAppUpdate } from '@/hooks/use-app-update';

/**
 * ElectronTitleBar — Custom draggable title bar for the frameless Electron window.
 * Renders only inside Electron. Shows NeuroNex branding + update indicator + native-style window controls.
 */
export const ElectronTitleBar = () => {
    const [maximized, setMaximized] = useState(false);
    const api = getElectronAPI();
    const { status, isUpdateAvailable, isDownloading, isDownloaded, downloadPercent, checkForUpdates } = useAppUpdate();

    useEffect(() => {
        if (!api) return;

        // Get initial state
        api.windowControls.isMaximized().then(setMaximized);

        // Listen for changes
        api.onMaximizeChange(setMaximized);

        return () => {
            api.removeAllListeners('window:maximized');
        };
    }, [api]);

    if (!isElectron()) return null;

    const hasUpdate = isUpdateAvailable || isDownloaded;

    // Determine update button state
    const getUpdateIcon = () => {
        if (status === 'checking') return <Loader2 size={12} strokeWidth={1.5} className="animate-spin" />;
        if (isDownloading) return <Download size={12} strokeWidth={1.5} />;
        if (isDownloaded) return <Check size={12} strokeWidth={1.5} />;
        if (isUpdateAvailable) return <ArrowUpCircle size={12} strokeWidth={1.5} />;
        return <ArrowUpCircle size={12} strokeWidth={1.5} />;
    };

    const getUpdateTooltip = () => {
        if (status === 'checking') return 'Verificando atualizações...';
        if (isDownloading) return `Baixando... ${Math.round(downloadPercent)}%`;
        if (isDownloaded) return 'Atualização pronta!';
        if (isUpdateAvailable) return 'Atualização disponível!';
        return 'Verificar atualizações';
    };

    return (
        <div
            className="electron-titlebar"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: '32px',
                zIndex: 99999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#0A0A0B',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                WebkitAppRegion: 'drag',
                userSelect: 'none',
                fontFamily: "'Inter', 'Manrope', sans-serif",
            } as React.CSSProperties & { WebkitAppRegion?: string }}
        >
            {/* ─── App Branding ─────────────────────────────────────── */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    paddingLeft: '12px',
                }}
            >
                <div
                    style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '4px',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))',
                        border: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="M2 17l10 5 10-5" />
                        <path d="M2 12l10 5 10-5" />
                    </svg>
                </div>
                <span
                    style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'rgba(255,255,255,0.5)',
                        letterSpacing: '0.04em',
                    }}
                >
                    NeuroNex Desktop
                </span>
            </div>

            {/* ─── Window Controls ─────────────────────────────────── */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'stretch',
                    height: '100%',
                    WebkitAppRegion: 'no-drag',
                } as React.CSSProperties & { WebkitAppRegion?: string }}
            >
                {/* Update Button */}
                <button
                    onClick={() => {
                        if (!isDownloading) {
                            checkForUpdates();
                        }
                    }}
                    style={{
                        width: '36px',
                        height: '100%',
                        border: 'none',
                        background: 'transparent',
                        color: hasUpdate
                            ? '#34d399'
                            : isDownloading
                                ? 'rgba(255,255,255,0.7)'
                                : 'rgba(255,255,255,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isDownloading ? 'default' : 'pointer',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        marginRight: '4px',
                    }}
                    onMouseEnter={(e) => {
                        if (!isDownloading) {
                            e.currentTarget.style.color = hasUpdate ? '#6ee7b7' : 'rgba(255,255,255,0.7)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = hasUpdate
                            ? '#34d399'
                            : isDownloading
                                ? 'rgba(255,255,255,0.7)'
                                : 'rgba(255,255,255,0.3)';
                    }}
                    title={getUpdateTooltip()}
                >
                    {getUpdateIcon()}

                    {/* Notification dot for available updates */}
                    {hasUpdate && (
                        <span
                            style={{
                                position: 'absolute',
                                top: '6px',
                                right: '6px',
                                width: '5px',
                                height: '5px',
                                borderRadius: '50%',
                                background: '#34d399',
                                boxShadow: '0 0 8px rgba(52,211,153,0.8)',
                                animation: 'pulse 2s infinite',
                            }}
                        />
                    )}

                    {/* Mini progress ring for downloading */}
                    {isDownloading && (
                        <svg
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: '22px',
                                height: '22px',
                            }}
                            viewBox="0 0 22 22"
                        >
                            <circle
                                cx="11"
                                cy="11"
                                r="9"
                                fill="none"
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth="1.5"
                            />
                            <circle
                                cx="11"
                                cy="11"
                                r="9"
                                fill="none"
                                stroke="rgba(255,255,255,0.7)"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeDasharray={`${(downloadPercent / 100) * 56.5} 56.5`}
                                transform="rotate(-90 11 11)"
                                style={{ transition: 'stroke-dasharray 0.3s ease' }}
                            />
                        </svg>
                    )}
                </button>

                {/* Minimize */}
                <button
                    onClick={() => api?.windowControls.minimize()}
                    className="electron-titlebar-btn"
                    style={{
                        width: '46px',
                        height: '100%',
                        border: 'none',
                        background: 'transparent',
                        color: 'rgba(255,255,255,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                        e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                    }}
                    title="Minimizar"
                >
                    <Minus size={14} strokeWidth={1.5} />
                </button>

                {/* Maximize/Restore */}
                <button
                    onClick={() => api?.windowControls.maximize()}
                    className="electron-titlebar-btn"
                    style={{
                        width: '46px',
                        height: '100%',
                        border: 'none',
                        background: 'transparent',
                        color: 'rgba(255,255,255,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                        e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                    }}
                    title={maximized ? 'Restaurar' : 'Maximizar'}
                >
                    {maximized ? <Copy size={12} strokeWidth={1.5} /> : <Square size={12} strokeWidth={1.5} />}
                </button>

                {/* Close */}
                <button
                    onClick={() => api?.windowControls.close()}
                    className="electron-titlebar-btn electron-titlebar-close"
                    style={{
                        width: '46px',
                        height: '100%',
                        border: 'none',
                        background: 'transparent',
                        color: 'rgba(255,255,255,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#e81123';
                        e.currentTarget.style.color = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                    }}
                    title="Fechar"
                >
                    <X size={14} strokeWidth={1.5} />
                </button>
            </div>
        </div>
    );
};
