import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';
import { TotpMfaDialog } from '@/components/settings/TotpMfaDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getAccountAssurance } from '@/hooks/use-account-security';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const AuthPageV2 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = new URLSearchParams(location.search).get('role') || 'pro';
  const [email, setEmail] = useState(localStorage.getItem('neuronex_remembered_email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(localStorage.getItem('neuronex_remember_me') === 'true');
  const [loading, setLoading] = useState(false);
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

  const evaluateSession = async () => {
    const session = await supabase.auth.getSession();
    if (!session.data.session) return;
    const assurance = await getAccountAssurance();
    if (assurance.error) throw assurance.error;
    if (assurance.data.nextLevel === 'aal2' && assurance.data.currentLevel !== 'aal2') setMfaOpen(true);
    else await redirect();
  };

  useEffect(() => { void evaluateSession().catch(() => undefined); }, []);

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

  const cancelMfa = async () => { setMfaOpen(false); await supabase.auth.signOut(); };

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
      <button onClick={() => setForgotOpen(true)} className="mt-6 w-full text-center text-xs font-semibold text-muted-foreground hover:text-foreground">Esqueci minha senha</button>
      <div className="mt-7 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5" /> Sessão protegida</div>
    </section>
    <ForgotPasswordModal open={forgotOpen} onOpenChange={setForgotOpen} />
    <TotpMfaDialog open={mfaOpen} mode="challenge" onOpenChange={setMfaOpen} onSuccess={redirect} onCancel={cancelMfa} />
  </main>;
};

export default AuthPageV2;
