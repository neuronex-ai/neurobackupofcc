import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Sparkles, X, Loader2, Check, Rocket, RefreshCw } from 'lucide-react';

interface UpdateModalProps {
    isOpen: boolean;
    status: 'available' | 'downloading' | 'downloaded' | string;
    version: string | null;
    currentVersion: string | null;
    downloadPercent: number;
    releaseNotes: string | null;
    onDismiss: () => void;
    onDownload: () => void;
    onInstall: () => void;
}

export const UpdateModal = ({
    isOpen,
    status,
    version,
    currentVersion,
    downloadPercent,
    releaseNotes: _releaseNotes,
    onDismiss,
    onDownload,
    onInstall,
}: UpdateModalProps) => {
    const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number; size: number }>>([]);

    useEffect(() => {
        if (isOpen) {
            const newParticles = Array.from({ length: 40 }, (_, i) => ({
                id: i,
                x: Math.random() * 100,
                y: Math.random() * 100,
                delay: Math.random() * 3,
                size: Math.random() * 3 + 1,
            }));
            setParticles(newParticles);
        }
    }, [isOpen]);

    const isDownloading = status === 'downloading';
    const isDownloaded = status === 'downloaded';

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[999999] flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                    {/* Premium Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/60 backdrop-blur-2xl"
                        onClick={!isDownloading ? onDismiss : undefined}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    {/* Modal Card */}
                    <motion.div
                        className="relative w-[420px] max-w-[calc(100vw-48px)] overflow-hidden"
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                        style={{
                            borderRadius: '32px',
                            background: 'linear-gradient(180deg, rgba(18, 18, 20, 0.98) 0%, rgba(8, 8, 10, 0.99) 100%)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            boxShadow: '0 64px 128px -32px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
                        }}
                    >
                        {/* Animated particles background */}
                        <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: '32px' }}>
                            {particles.map((p) => (
                                <motion.div
                                    key={p.id}
                                    className="absolute rounded-full"
                                    style={{
                                        left: `${p.x}%`,
                                        top: `${p.y}%`,
                                        width: p.size,
                                        height: p.size,
                                        background: `rgba(255, 255, 255, ${0.1 + Math.random() * 0.15})`,
                                    }}
                                    animate={{
                                        y: [0, -30, 0],
                                        opacity: [0.1, 0.5, 0.1],
                                    }}
                                    transition={{
                                        duration: 3 + Math.random() * 2,
                                        delay: p.delay,
                                        repeat: Infinity,
                                        ease: 'easeInOut',
                                    }}
                                />
                            ))}
                        </div>

                        {/* Top gradient accent */}
                        <div
                            className="absolute top-0 left-0 right-0 h-[200px] pointer-events-none"
                            style={{
                                background: 'radial-gradient(ellipse at center top, rgba(255,255,255,0.06) 0%, transparent 70%)',
                            }}
                        />

                        {/* Close button */}
                        {!isDownloading && (
                            <motion.button
                                className="absolute top-5 right-5 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300"
                                style={{
                                    background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                }}
                                whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.12)' }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onDismiss}
                            >
                                <X size={14} className="text-white/50" />
                            </motion.button>
                        )}

                        {/* Content */}
                        <div className="relative z-10 p-8 pt-10">
                            {/* Icon */}
                            <motion.div
                                className="flex items-center justify-center mb-8"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 15 }}
                            >
                                <div
                                    className="relative w-20 h-20 rounded-[24px] flex items-center justify-center"
                                    style={{
                                        background: isDownloaded
                                            ? 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.1))'
                                            : 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.04))',
                                        border: `1px solid ${isDownloaded ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`,
                                        boxShadow: isDownloaded
                                            ? '0 0 40px rgba(34,197,94,0.15), inset 0 1px 0 rgba(34,197,94,0.2)'
                                            : '0 0 40px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.1)',
                                    }}
                                >
                                    {isDownloading ? (
                                        <Loader2 size={32} className="text-white/80 animate-spin" />
                                    ) : isDownloaded ? (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 300 }}
                                        >
                                            <Check size={32} className="text-emerald-400" />
                                        </motion.div>
                                    ) : (
                                        <Rocket size={32} className="text-white/80" />
                                    )}

                                    {/* Pulse ring */}
                                    <motion.div
                                        className="absolute inset-0 rounded-[24px]"
                                        style={{
                                            border: `2px solid ${isDownloaded ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.15)'}`,
                                        }}
                                        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                    />
                                </div>
                            </motion.div>

                            {/* Title */}
                            <motion.div
                                className="text-center mb-2"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <h2
                                    style={{
                                        fontSize: '20px',
                                        fontWeight: 800,
                                        color: 'white',
                                        letterSpacing: '-0.02em',
                                        lineHeight: 1.3,
                                    }}
                                >
                                    {isDownloaded
                                        ? 'Atualização Pronta!'
                                        : isDownloading
                                            ? 'Baixando Atualização...'
                                            : 'Nova Versão Disponível'}
                                </h2>
                            </motion.div>

                            {/* Subtitle / Version badge */}
                            <motion.div
                                className="flex items-center justify-center gap-3 mb-6"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                {currentVersion && (
                                    <span
                                        style={{
                                            fontSize: '10px',
                                            fontWeight: 700,
                                            color: 'rgba(255,255,255,0.3)',
                                            letterSpacing: '0.1em',
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        v{currentVersion}
                                    </span>
                                )}
                                {currentVersion && version && (
                                    <motion.div
                                        animate={{ x: [0, 4, 0] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                    >
                                        <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                                            <path d="M1 5h14M11 1l4 4-4 4" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </motion.div>
                                )}
                                {version && (
                                    <div
                                        style={{
                                            padding: '4px 12px',
                                            borderRadius: '999px',
                                            background: isDownloaded
                                                ? 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.1))'
                                                : 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06))',
                                            border: `1px solid ${isDownloaded ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.12)'}`,
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: '10px',
                                                fontWeight: 800,
                                                color: isDownloaded ? '#34d399' : 'rgba(255,255,255,0.8)',
                                                letterSpacing: '0.1em',
                                                textTransform: 'uppercase',
                                            }}
                                        >
                                            v{version}
                                        </span>
                                    </div>
                                )}
                            </motion.div>

                            {/* Description */}
                            <motion.p
                                className="text-center mb-8"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.55 }}
                                style={{
                                    fontSize: '13px',
                                    color: 'rgba(255,255,255,0.45)',
                                    lineHeight: 1.7,
                                    fontWeight: 500,
                                }}
                            >
                                {isDownloaded
                                    ? 'A atualização foi baixada com sucesso. Reinicie o aplicativo para aplicar as melhorias.'
                                    : isDownloading
                                        ? 'Aguarde enquanto preparamos a nova versão para você...'
                                        : 'Uma nova versão do NeuroNex Desktop está disponível com melhorias e correções.'}
                            </motion.p>

                            {/* Download Progress Bar */}
                            {isDownloading && (
                                <motion.div
                                    className="mb-8"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <span
                                            style={{
                                                fontSize: '10px',
                                                fontWeight: 700,
                                                color: 'rgba(255,255,255,0.4)',
                                                letterSpacing: '0.15em',
                                                textTransform: 'uppercase',
                                            }}
                                        >
                                            Progresso
                                        </span>
                                        <span
                                            style={{
                                                fontSize: '11px',
                                                fontWeight: 800,
                                                color: 'rgba(255,255,255,0.7)',
                                                fontVariantNumeric: 'tabular-nums',
                                            }}
                                        >
                                            {Math.round(downloadPercent)}%
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            height: '4px',
                                            borderRadius: '999px',
                                            background: 'rgba(255,255,255,0.06)',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <motion.div
                                            style={{
                                                height: '100%',
                                                borderRadius: '999px',
                                                background: 'linear-gradient(90deg, rgba(255,255,255,0.5), rgba(255,255,255,0.9))',
                                                boxShadow: '0 0 20px rgba(255,255,255,0.3)',
                                            }}
                                            initial={{ width: '0%' }}
                                            animate={{ width: `${downloadPercent}%` }}
                                            transition={{ duration: 0.3, ease: 'easeOut' }}
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {/* CTA Buttons */}
                            <motion.div
                                className="flex flex-col gap-3"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.65 }}
                            >
                                {isDownloaded ? (
                                    <motion.button
                                        className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-sm transition-all duration-300"
                                        style={{
                                            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                                            color: 'white',
                                            border: '1px solid rgba(34,197,94,0.5)',
                                            boxShadow: '0 0 40px rgba(34,197,94,0.25), 0 8px 32px -8px rgba(34,197,94,0.3)',
                                            letterSpacing: '0.05em',
                                            textTransform: 'uppercase',
                                            fontSize: '11px',
                                            fontWeight: 800,
                                        }}
                                        whileHover={{ scale: 1.02, boxShadow: '0 0 60px rgba(34,197,94,0.35), 0 12px 48px -8px rgba(34,197,94,0.4)' }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={onInstall}
                                    >
                                        <RefreshCw size={14} />
                                        Reiniciar e Atualizar
                                    </motion.button>
                                ) : isDownloading ? null : (
                                    <>
                                        <motion.button
                                            className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-sm transition-all duration-300"
                                            style={{
                                                background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))',
                                                color: '#09090b',
                                                border: '1px solid rgba(255,255,255,0.3)',
                                                boxShadow: '0 0 40px rgba(255,255,255,0.1), 0 8px 32px -8px rgba(0,0,0,0.3)',
                                                letterSpacing: '0.05em',
                                                textTransform: 'uppercase',
                                                fontSize: '11px',
                                                fontWeight: 800,
                                            }}
                                            whileHover={{ scale: 1.02, boxShadow: '0 0 60px rgba(255,255,255,0.15), 0 12px 48px -8px rgba(0,0,0,0.4)' }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={onDownload}
                                        >
                                            <Download size={14} />
                                            Atualizar Agora
                                        </motion.button>

                                        <motion.button
                                            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl transition-all duration-300"
                                            style={{
                                                background: 'transparent',
                                                color: 'rgba(255,255,255,0.35)',
                                                border: '1px solid rgba(255,255,255,0.06)',
                                                fontSize: '10px',
                                                fontWeight: 700,
                                                letterSpacing: '0.1em',
                                                textTransform: 'uppercase',
                                            }}
                                            whileHover={{
                                                borderColor: 'rgba(255,255,255,0.12)',
                                                color: 'rgba(255,255,255,0.5)',
                                            }}
                                            onClick={onDismiss}
                                        >
                                            Lembrar Depois
                                        </motion.button>
                                    </>
                                )}
                            </motion.div>
                        </div>

                        {/* Bottom subtle branding */}
                        <motion.div
                            className="relative z-10 flex items-center justify-center gap-2 pb-6"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                        >
                            <Sparkles size={10} className="text-white/20" />
                            <span
                                style={{
                                    fontSize: '9px',
                                    fontWeight: 700,
                                    color: 'rgba(255,255,255,0.15)',
                                    letterSpacing: '0.2em',
                                    textTransform: 'uppercase',
                                }}
                            >
                                NeuroNex Desktop
                            </span>
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
