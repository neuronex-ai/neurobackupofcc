import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';
import { TotpMfaDialog } from '@/components/settings/TotpMfaDialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { getAccountAssurance } from '@/hooks/use-account-security';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/integrations/supabase/client';
import {
  disableBiometricSignIn,
  enableBiometricSignIn,
  getBiometricPreferenceForUser,
  getBiometricStatus,
  getStoredBiometricAccount,
  hasNativeSecureBridge,
  isBiometricStatusUsable,
  restoreBiometricSession,
  type BiometricStatus,
  type StoredBiometricAccount,
} from '@/lib/native-mobile-security';
import type { Session } from '@supabase/supabase-js';
import { Eye, EyeOff, Fingerprint, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const AuthPageV2 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { theme } = useTheme();
  const role = new URLSearchParams(location.search).get('role') || 'pro';
  const [email, setEmail] = useState(localStorage.getItem('neuronex_remembered_email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(localStorage.getItem('neuronex_remember_me') === 'true');
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState<BiometricStatus | null>(null);
  const [biometricAccount, setBiometricAccount] = useState<StoredBiometricAccount | null>(null);
  const [biometricPromptOpen, setBiometricPromptOpen] = useState(false);
  const [autoBiometricAttempted, setAutoBiometricAttempted] = useState(false);
  const [pendingBiometricSession, setPendingBiometricSession] = useState<Session | null>(null);
  const [mfaOpen, setMfaOpen] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  const redirect = async () => {
    const session = await supabase.auth.getSession();
    const user = session.data.session?.user;
    if (!user) return;
    if (role === 'patient') return navigate('/portal', { replace: true });
    const profile = await supabase.from('profiles').select('setup_completed').eq('id', user.id).maybeSingle();
    navigate(profile.data?.setup_completed ? '/dashboard' : '/initial-settings', { replace: true });
  };

  const refreshBiometricState = async () => {
    const [status, account] = await Promise.all([
      getBiometricStatus(),
      Promise.resolve(getStoredBiometricAccount()),
    ]);
    setBiometricStatus(status);
    setBiometricAccount(account);
  };

  const shouldOfferBiometric = async (session: Session | null) => {
    if (!session?.user || role === 'patient') return false;
    const status = biometricStatus || await getBiometricStatus();
    const account = getStoredBiometricAccount();
    const preference = getBiometricPreferenceForUser(session.user.id);
    if (!hasNativeSecureBridge() || !isBiometricStatusUsable(status)) return false;
    if (account?.userId === session.user.id) return false;
    if (preference !== "unset") return false;
    setPendingBiometricSession(session);
    setBiometricPromptOpen(true);
    return true;
  };

  const finishAuthenticatedSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (await shouldOfferBiometric(session)) return;
    await redirect();
  };

  const evaluateSession = async () => {
    const session = await supabase.auth.getSession();
    if (!session.data.session) return;
    const assurance = await getAccountAssurance();
    if (assurance.error) throw assurance.error;
    if (assurance.data.nextLevel === 'aal2' && assurance.data.currentLevel !== 'aal2') setMfaOpen(true);
    else await finishAuthenticatedSession();
  };

  useEffect(() => {
    void refreshBiometricState().catch(() => undefined);
    void evaluateSession().catch(() => undefined);
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email || !password) return toast.error('Preencha e-mail e senha.');
    setLoading(true);
    try {
      const result = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (result.error) throw result.error;
      if (remember) {
        localStorage.setItem('neuronex_remember_me', 'true');
        localStorage.setItem('neuronex_remembered_email', email.trim().toLowerCase());
      } else {
        localStorage.removeItem('neuronex_remember_me');
        localStorage.removeItem('neuronex_remembered_email');
      }
      await evaluateSession();
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : 'Não foi possível entrar.'); }
    finally { setLoading(false); }
  };

  const unlockWithBiometrics = async () => {
    setBiometricLoading(true);
    try {
      const restored = await restoreBiometricSession();
      const { error } = await supabase.auth.setSession({
        access_token: restored.session.access_token,
        refresh_token: restored.session.refresh_token,
      });
      if (error) throw error;
      toast.success('Sessao desbloqueada com biometria.');
      await evaluateSession();
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : 'Use e-mail e senha para entrar neste dispositivo.',
      );
    } finally {
      setBiometricLoading(false);
    }
  };

  const enableBiometrics = async () => {
    if (!pendingBiometricSession?.user) return;
    setBiometricLoading(true);
    try {
      await enableBiometricSignIn({
        userId: pendingBiometricSession.user.id,
        email: pendingBiometricSession.user.email,
        session: pendingBiometricSession,
      });
      await refreshBiometricState();
      setBiometricPromptOpen(false);
      setPendingBiometricSession(null);
      toast.success('Entrar com biometria ativado neste aparelho.');
      await redirect();
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : 'Nao foi possivel ativar biometria agora.',
      );
    } finally {
      setBiometricLoading(false);
    }
  };

  const skipBiometrics = async () => {
    if (pendingBiometricSession?.user?.id) {
      await disableBiometricSignIn(pendingBiometricSession.user.id).catch(() => undefined);
      await refreshBiometricState().catch(() => undefined);
    }
    setBiometricPromptOpen(false);
    setPendingBiometricSession(null);
    await redirect();
  };

  const cancelMfa = async () => { setMfaOpen(false); await supabase.auth.signOut(); };
  const canUseBiometrics =
    role !== 'patient' &&
    hasNativeSecureBridge() &&
    isBiometricStatusUsable(biometricStatus) &&
    biometricAccount;

  useEffect(() => {
    if (!canUseBiometrics || autoBiometricAttempted || biometricLoading || loading) return;
    setAutoBiometricAttempted(true);
    void unlockWithBiometrics();
  }, [autoBiometricAttempted, biometricLoading, canUseBiometrics, loading]);

  const isDarkTheme = theme === 'dark';
  const mobilePanelIsLight = isMobile && isDarkTheme;
  const logoSrc = isDarkTheme ? '/favicon-light.png' : '/favicon-dark.png';

  if (isMobile) {
    return (
      <main className={cn(
        "relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-[calc(1rem+env(safe-area-inset-top))]",
        isDarkTheme ? "bg-black text-black" : "bg-white text-white",
      )}>
        <section className={cn(
          "relative w-full max-w-md rounded-[34px] px-7 pb-7 pt-10 shadow-2xl",
          "min-h-[min(78dvh,42rem)]",
          mobilePanelIsLight ? "bg-white text-black" : "bg-[#1f1d1d] text-white",
        )}>
          <div className="mb-10 text-center">
            <img src={logoSrc} alt="NeuroNex" className="mx-auto h-14 w-14 object-contain" />
            <h1 className="sr-only">{role === 'patient' ? 'Area do paciente' : 'Acesso profissional'}</h1>
          </div>

          <form onSubmit={submit} className="space-y-7">
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              className="h-12 rounded-none border-x-0 border-t-0 border-current/18 bg-transparent px-0 text-sm font-semibold text-current placeholder:text-current/70 focus-visible:ring-0"
            />
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                className="h-12 rounded-none border-x-0 border-t-0 border-current/18 bg-transparent px-0 pr-9 text-sm font-semibold text-current placeholder:text-current/70 focus-visible:ring-0"
              />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-0 top-1/2 -translate-y-1/2 text-current/60" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className={cn(
                "mt-8 h-12 w-full rounded-[10px] text-[11px] font-black",
                mobilePanelIsLight
                  ? "bg-[#1f1d1d] text-white hover:bg-black"
                  : "bg-[#fff2f5] text-[#1f1d1d] hover:bg-white",
              )}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Login'}
            </Button>

            <label className="flex items-center gap-3 text-xs font-bold text-current">
              <span className="mr-auto">Remember me</span>
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                className="h-4 w-7 accent-current"
              />
            </label>
          </form>

          {canUseBiometrics ? (
            <Button
              type="button"
              variant="outline"
              disabled={biometricLoading || loading}
              onClick={() => void unlockWithBiometrics()}
              className="mt-3 h-12 w-full rounded-[10px] border-current/20 bg-transparent text-[10px] font-black uppercase tracking-[.12em] text-current"
            >
              {biometricLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Fingerprint className="mr-2 h-4 w-4" />}
              Entrar com biometria
            </Button>
          ) : null}

          <button onClick={() => setForgotOpen(true)} className="mt-6 w-full text-center text-xs font-semibold text-current/70">Esqueci minha senha</button>
          <div className="mt-7 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-current/55"><ShieldCheck className="h-3.5 w-3.5" /> Sessao protegida</div>
        </section>

        <ForgotPasswordModal open={forgotOpen} onOpenChange={setForgotOpen} />
        <TotpMfaDialog open={mfaOpen} mode="challenge" onOpenChange={setMfaOpen} onSuccess={finishAuthenticatedSession} onCancel={cancelMfa} />
        <Dialog
          open={biometricPromptOpen}
          onOpenChange={(open) => {
            if (biometricLoading) return;
            if (!open) void skipBiometrics();
            else setBiometricPromptOpen(open);
          }}
        >
          <DialogContent className="max-w-sm rounded-[28px] p-6">
            <DialogHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-[18px] border border-border/40 bg-card">
                <Fingerprint className="h-5 w-5" />
              </div>
              <DialogTitle>Entrar com biometria?</DialogTitle>
              <DialogDescription>
                Ative neste aparelho para desbloquear o app com digital, rosto ou senha do dispositivo. Se falhar, o login normal continua disponivel.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:space-x-0">
              <Button type="button" variant="ghost" disabled={biometricLoading} onClick={() => void skipBiometrics()}>
                Agora nao
              </Button>
              <Button type="button" disabled={biometricLoading} onClick={() => void enableBiometrics()}>
                {biometricLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Ativar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    );
  }

  return <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-5">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(139,92,246,.12),transparent_35%),radial-gradient(circle_at_90%_90%,rgba(255,255,255,.05),transparent_30%)]" />
    <section className="relative w-full max-w-md rounded-[38px] border border-border/30 bg-card/80 p-8 shadow-2xl backdrop-blur-3xl md:p-11">
      <div className="mb-8 text-center"><img src="/favicon-light.png" alt="NeuroNex" className="mx-auto h-16 w-16 object-contain" /><h1 className="mt-5 text-3xl font-black tracking-tight">{role === 'patient' ? 'Área do paciente' : 'Acesso profissional'}</h1><p className="mt-2 text-xs font-bold uppercase tracking-[.2em] text-muted-foreground">Segurança NeuroNex</p></div>
      <form onSubmit={submit} className="space-y-4">
        <div className="relative"><Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="E-mail" className="h-14 rounded-2xl pl-11" /></div>
        <div className="relative"><Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Senha" className="h-14 rounded-2xl px-11" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
        <label className="flex items-center gap-3 text-xs text-muted-foreground"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /> Manter meu e-mail neste dispositivo</label>
        <Button type="submit" disabled={loading} className="h-14 w-full rounded-2xl font-black uppercase tracking-[.2em]">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Entrar'}</Button>
      </form>
      {canUseBiometrics ? (
        <Button
          type="button"
          variant="outline"
          disabled={biometricLoading || loading}
          onClick={() => void unlockWithBiometrics()}
          className="mt-3 h-14 w-full rounded-2xl font-black uppercase tracking-[.16em]"
        >
          {biometricLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Fingerprint className="mr-2 h-4 w-4" />}
          Entrar com biometria
        </Button>
      ) : null}
      <button onClick={() => setForgotOpen(true)} className="mt-6 w-full text-center text-xs font-semibold text-muted-foreground hover:text-foreground">Esqueci minha senha</button>
      <div className="mt-7 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5" /> Sessão protegida</div>
    </section>
    <ForgotPasswordModal open={forgotOpen} onOpenChange={setForgotOpen} />
    <TotpMfaDialog open={mfaOpen} mode="challenge" onOpenChange={setMfaOpen} onSuccess={finishAuthenticatedSession} onCancel={cancelMfa} />
    <Dialog
      open={biometricPromptOpen}
      onOpenChange={(open) => {
        if (biometricLoading) return;
        if (!open) void skipBiometrics();
        else setBiometricPromptOpen(open);
      }}
    >
      <DialogContent className="max-w-sm rounded-[28px] p-6">
        <DialogHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-[18px] border border-border/40 bg-card">
            <Fingerprint className="h-5 w-5" />
          </div>
          <DialogTitle>Entrar com biometria?</DialogTitle>
          <DialogDescription>
            Ative neste aparelho para desbloquear o app com digital, rosto ou senha do dispositivo. Se falhar, o login normal continua disponivel.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:space-x-0">
          <Button
            type="button"
            variant="ghost"
            disabled={biometricLoading}
            onClick={() => void skipBiometrics()}
          >
            Agora nao
          </Button>
          <Button
            type="button"
            disabled={biometricLoading}
            onClick={() => void enableBiometrics()}
          >
            {biometricLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Ativar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </main>;
};

export default AuthPageV2;
