import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';
import { enrollTotpFactor, getVerifiedTotpFactor, removeTotpFactor, verifyTotpCode } from '@/hooks/use-totp-mfa';
import { cn } from '@/lib/utils';
import { motion, useReducedMotion } from 'framer-motion';
import { Clipboard, KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

type Props = {
  open: boolean;
  mode: 'enroll' | 'challenge' | 'disable';
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
};

export const TotpMfaDialog = ({ open, mode, onOpenChange, onSuccess, onCancel }: Props) => {
  const isMobile = useIsMobile();
  const shouldReduceMotion = Boolean(useReducedMotion());
  const [factorId, setFactorId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const pendingEnrollment = useRef<string | null>(null);
  const completed = useRef(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setFactorId('');
    setQrCode('');
    setSecret('');
    setCode('');
    setError('');
    setLoading(true);
    pendingEnrollment.current = null;
    completed.current = false;

    const prepare = async () => {
      if (mode === 'enroll') {
        const factor = await enrollTotpFactor();
        if (!active) return;
        pendingEnrollment.current = factor.id;
        setFactorId(factor.id);
        setQrCode(factor.totp.qr_code);
        setSecret(factor.totp.secret);
        return;
      }

      const factor = await getVerifiedTotpFactor();
      if (!factor) throw new Error('Nenhum autenticador ativo foi encontrado.');
      if (active) setFactorId(factor.id);
    };

    void prepare()
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Falha ao preparar a verificação.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [mode, open]);

  const cleanupPendingEnrollment = async () => {
    if (pendingEnrollment.current && !completed.current) {
      await removeTotpFactor(pendingEnrollment.current).catch(() => undefined);
      pendingEnrollment.current = null;
    }
  };

  const close = async () => {
    await cleanupPendingEnrollment();
    onOpenChange(false);
    await onCancel?.();
  };

  const verify = async () => {
    if (!factorId || !/^\d{6}$/.test(code)) {
      setError('Digite os seis números exibidos no aplicativo autenticador.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await verifyTotpCode(factorId, code);
      if (mode === 'disable') await removeTotpFactor(factorId);
      completed.current = true;
      pendingEnrollment.current = null;
      toast.success(mode === 'enroll'
        ? 'Google Authenticator conectado.'
        : mode === 'disable'
          ? 'Autenticação desativada.'
          : 'Identidade verificada.');
      await onSuccess();
      onOpenChange(false);
    } catch {
      setCode('');
      setError('Código inválido ou expirado. Aguarde o próximo código e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const copySecret = async () => {
    await navigator.clipboard.writeText(secret);
    toast.success('Chave manual copiada.');
  };

  const title = mode === 'enroll'
    ? 'Conectar Google Authenticator'
    : mode === 'disable'
      ? 'Confirmar desativação'
      : 'Inserir token do Google Authenticator';
  const eyebrow = mode === 'enroll'
    ? 'Autenticador'
    : mode === 'disable'
      ? 'Segurança da conta'
      : 'Autenticação exigida';
  const description = mode === 'enroll'
    ? 'Escaneie o QR Code no Google Authenticator e confirme o primeiro código para concluir a conexão.'
    : mode === 'disable'
      ? 'Informe o código atual do aplicativo para desativar a verificação em duas etapas com segurança.'
      : 'Informe o código atual do Google Authenticator para continuar com uma sessão protegida.';
  const actionLabel = mode === 'enroll'
    ? 'Conectar e verificar'
    : mode === 'disable'
      ? 'Desativar'
      : 'Verificar token';
  const Icon = mode === 'challenge' ? KeyRound : ShieldCheck;
  const contentMotion = shouldReduceMotion
    ? {}
    : {
      initial: { opacity: 0, y: isMobile ? 16 : 10, scale: 0.98 },
      animate: { opacity: 1, y: 0, scale: 1 },
      transition: { type: 'spring', stiffness: 280, damping: 28 },
    };
  const qrMotion = shouldReduceMotion
    ? {}
    : {
      initial: { opacity: 0, y: 12, scale: 0.96 },
      animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        boxShadow: [
          '0 18px 48px -34px rgba(0,0,0,0.5)',
          '0 26px 72px -38px rgba(255,255,255,0.38)',
          '0 18px 48px -34px rgba(0,0,0,0.5)',
        ],
      },
      transition: {
        opacity: { duration: 0.18 },
        y: { type: 'spring', stiffness: 260, damping: 24 },
        scale: { type: 'spring', stiffness: 260, damping: 24 },
        boxShadow: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
      },
    };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) void close(); }}>
      <DialogContent
        className={cn(
          'gap-0 border p-0 text-foreground shadow-2xl outline-none',
          'max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] overflow-y-auto overscroll-contain rounded-[30px]',
          'border-black/10 bg-white/95 backdrop-blur-2xl dark:border-white/12 dark:bg-[#08080a]/95',
          'sm:max-h-[calc(100dvh-2.5rem)] sm:overflow-y-auto',
          isMobile ? 'max-w-[min(100vw-1rem,25rem)]' : 'sm:max-w-[30rem] sm:rounded-[34px]',
        )}
        onInteractOutside={(event) => { if (mode === 'challenge') event.preventDefault(); }}
        onEscapeKeyDown={(event) => { if (mode === 'challenge') event.preventDefault(); }}
      >
        <motion.div
          {...contentMotion}
          className={cn(
            'relative overflow-hidden px-5 py-6 text-left',
            isMobile ? 'pb-[calc(1.5rem+env(safe-area-inset-bottom))]' : 'sm:p-8',
          )}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/20 to-transparent dark:via-white/25" />

          <div className="flex items-start gap-4">
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.92 }}
              animate={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] border border-black/10 bg-black/[0.035] text-zinc-950 shadow-sm dark:border-white/10 dark:bg-white/[0.06] dark:text-white"
            >
              <Icon className="h-6 w-6" />
            </motion.div>
            <div className="min-w-0 pt-0.5">
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p>
              <DialogTitle className="mt-2 text-2xl font-black leading-[1.02] tracking-normal text-foreground">
                {title}
              </DialogTitle>
            </div>
          </div>

          <DialogDescription className="mt-4 text-sm font-medium leading-relaxed text-zinc-600 dark:text-zinc-300">
            {description}
          </DialogDescription>

          {loading && !factorId ? (
            <div className="mt-7 flex items-center justify-center rounded-[24px] border border-border/45 bg-muted/35 py-8 dark:border-white/10 dark:bg-white/[0.035]">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : null}

          {qrCode ? (
            <div className="mt-6 space-y-3 text-center">
              <motion.div
                {...qrMotion}
                className="mx-auto w-fit rounded-[28px] border border-black/10 bg-white p-3 shadow-2xl dark:border-white/10"
              >
                <div className="rounded-[20px] border border-zinc-100 bg-white p-3">
                  <img src={qrCode} alt="QR Code para autenticador" className={cn(isMobile ? 'h-44 w-44' : 'h-48 w-48')} />
                </div>
              </motion.div>
              <button
                type="button"
                onClick={() => void copySecret()}
                className="inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Clipboard className="h-3.5 w-3.5" /> Copiar chave manual
              </button>
            </div>
          ) : null}

          {factorId ? (
            <div className="mt-6 space-y-2">
              <Input
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={(event) => { if (event.key === 'Enter') void verify(); }}
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                placeholder="000000"
                aria-label="Código de seis dígitos"
                className="h-16 rounded-[22px] border-black/10 bg-zinc-950/[0.035] text-center text-2xl font-black tracking-[0.32em] text-foreground shadow-inner placeholder:text-muted-foreground/35 focus-visible:ring-2 focus-visible:ring-ring dark:border-white/10 dark:bg-white/[0.055]"
              />
              <p className="text-center text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
                6 dígitos
              </p>
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="mt-4 rounded-2xl border border-destructive/15 bg-destructive/10 px-4 py-3 text-xs font-semibold leading-relaxed text-destructive">
              {error}
            </p>
          ) : null}

          <div className="mt-6 space-y-3">
            <Button
              onClick={() => void verify()}
              disabled={loading || code.length !== 6}
              className="h-12 w-full rounded-[18px] bg-foreground text-[11px] font-black uppercase tracking-[0.14em] text-background shadow-xl shadow-black/10 hover:bg-foreground/90 disabled:opacity-45 dark:shadow-black/35"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : actionLabel}
            </Button>
            <button
              type="button"
              onClick={() => void close()}
              className="min-h-10 w-full rounded-[16px] text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/65 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {mode === 'challenge' ? 'Sair da conta' : 'Cancelar'}
            </button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};
