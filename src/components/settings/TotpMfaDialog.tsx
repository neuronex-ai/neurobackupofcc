import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { enrollTotpFactor, getVerifiedTotpFactor, removeTotpFactor, verifyTotpCode } from '@/hooks/use-totp-mfa';
import { Clipboard, Loader2, ShieldCheck } from 'lucide-react';
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
    ? 'Ativar Google Authenticator'
    : mode === 'disable'
      ? 'Confirmar desativação'
      : 'Verificação em duas etapas';

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) void close(); }}>
      <DialogContent
        className="rounded-[32px] bg-card/95 p-8 shadow-2xl sm:max-w-[480px]"
        onInteractOutside={(event) => { if (mode === 'challenge') event.preventDefault(); }}
        onEscapeKeyDown={(event) => { if (mode === 'challenge') event.preventDefault(); }}
      >
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-primary/10">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-black">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === 'enroll' ? 'Escaneie o QR Code e confirme o primeiro código.' : 'Informe o código atual do aplicativo.'}
            </p>
          </div>

          {loading && !factorId ? <Loader2 className="mx-auto h-7 w-7 animate-spin" /> : null}

          {qrCode ? (
            <>
              <div className="mx-auto w-fit rounded-[28px] bg-white p-5 shadow-2xl">
                <img src={qrCode} alt="QR Code para autenticador" className="h-48 w-48" />
              </div>
              <button type="button" onClick={() => void copySecret()} className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
                <Clipboard className="h-3.5 w-3.5" /> Copiar chave manual
              </button>
            </>
          ) : null}

          {factorId ? (
            <Input
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(event) => { if (event.key === 'Enter') void verify(); }}
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              placeholder="000000"
              className="h-16 rounded-2xl text-center text-2xl font-black tracking-[.4em]"
            />
          ) : null}

          {error ? <p className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive">{error}</p> : null}

          <Button onClick={() => void verify()} disabled={loading || code.length !== 6} className="h-12 w-full rounded-2xl">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirmar'}
          </Button>
          <button type="button" onClick={() => void close()} className="text-xs text-muted-foreground hover:text-foreground">
            {mode === 'challenge' ? 'Sair da conta' : 'Cancelar'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
