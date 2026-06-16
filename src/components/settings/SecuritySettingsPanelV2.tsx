import { useAuth } from '@/components/auth/SessionContextProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useFinancialSettings } from '@/hooks/use-financial-settings';
import { useProfile } from '@/hooks/use-profile';
import { supabase } from '@/integrations/supabase/client';
import {
  disableBiometricSignIn,
  enableBiometricSignIn,
  canAttemptNativeBiometrics,
  getBiometricPreferenceForUser,
  getBiometricStatus,
  isBiometricStatusUsable,
  isBiometricEnabledForUser,
  type BiometricPreference,
  type BiometricStatus,
} from '@/lib/native-mobile-security';
import { Fingerprint, KeyRound, Loader2, Mail, Phone } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { AuthenticatorSettings } from './AuthenticatorSettings';
import { SetPinModal } from './SetPinModal';

const Card = ({ children }: { children: ReactNode }) => (
  <section className="rounded-[24px] border border-border/50 bg-card p-6 md:p-8">{children}</section>
);

export const SecuritySettingsPanelV2 = () => {
  const { session, user } = useAuth();
  const { profile, refetch: refetchProfile } = useProfile();
  const { settings, refetch: refetchFinancial } = useFinancialSettings();
  const [pinOpen, setPinOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [biometricBusy, setBiometricBusy] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState<BiometricStatus | null>(null);
  const [biometricPreference, setBiometricPreference] = useState<BiometricPreference>('unset');

  const refreshBiometricSettings = async () => {
    const status = await getBiometricStatus();
    setBiometricStatus(status);
    setBiometricPreference(getBiometricPreferenceForUser(user?.id));
  };

  useEffect(() => {
    void refreshBiometricSettings().catch(() => undefined);
  }, [user?.id]);

  const changeEmail = async () => {
    if (!newEmail.includes('@')) return toast.error('Digite um e-mail válido.');
    setSaving('email');
    try {
      const result = await supabase.auth.updateUser({ email: newEmail.trim().toLowerCase() });
      if (result.error) throw result.error;
      setNewEmail('');
      toast.success('Enviamos a confirmação para o novo endereço.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível alterar o e-mail.');
    } finally {
      setSaving(null);
    }
  };

  const changePhone = async () => {
    if (!newPhone.trim() || !user) return toast.error('Digite um telefone válido.');
    setSaving('phone');
    try {
      const result = await supabase.from('profiles').update({ phone: newPhone.trim() }).eq('id', user.id);
      if (result.error) throw result.error;
      setNewPhone('');
      await refetchProfile();
      toast.success('Telefone atualizado. SMS permanece desabilitado.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar o telefone.');
    } finally {
      setSaving(null);
    }
  };

  const changePassword = async () => {
    if (!user?.email || !currentPassword || !newPassword) return toast.error('Preencha todos os campos.');
    if (newPassword.length < 8) return toast.error('Use pelo menos oito caracteres.');
    if (newPassword !== confirmPassword) return toast.error('As novas senhas não coincidem.');
    setSaving('password');
    try {
      const authentication = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
      if (authentication.error) throw new Error('A senha atual não confere.');
      const result = await supabase.auth.updateUser({ password: newPassword });
      if (result.error) throw result.error;
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Senha alterada com segurança.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível alterar a senha.');
    } finally {
      setSaving(null);
    }
  };

  const toggleBiometrics = async (enabled: boolean) => {
    if (!user?.id) return;
    setBiometricBusy(true);
    try {
      if (enabled) {
        if (!session) throw new Error('Entre novamente para ativar a biometria neste aparelho.');
        await enableBiometricSignIn({
          userId: user.id,
          email: user.email,
          session,
        });
        toast.success('Login com biometria ativado neste aparelho.');
      } else {
        await disableBiometricSignIn(user.id);
        toast.success('Login com biometria desativado neste aparelho.');
      }
      await refreshBiometricSettings();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nao foi possivel alterar a biometria.');
    } finally {
      setBiometricBusy(false);
    }
  };

  const biometricEnabled = Boolean(user?.id && isBiometricEnabledForUser(user.id));
  const biometricAvailable = Boolean(isBiometricStatusUsable(biometricStatus));
  const biometricCanAttempt = biometricAvailable || canAttemptNativeBiometrics();
  const biometricStatusText = !biometricAvailable
    ? biometricCanAttempt
      ? 'Toque para validar a biometria neste aparelho.'
      : 'Disponivel em aparelhos com biometria, bloqueio seguro ou autenticador de plataforma.'
    : biometricAvailable
      ? biometricPreference === 'disabled'
        ? 'Desativado por escolha neste aparelho.'
        : 'Aparelho pronto para login e transacoes com biometria.'
      : biometricStatus?.reason || 'Configure digital, rosto ou bloqueio seguro no aparelho.';

  return (
    <div className="max-w-4xl space-y-8">
      <header>
        <h2 className="text-2xl font-bold">Login e Segurança</h2>
        <p className="mt-1 text-sm text-muted-foreground">Gerencie acesso, credenciais e proteção financeira.</p>
      </header>

      <AuthenticatorSettings />

      <Card>
        <div className="flex items-start justify-between gap-5">
          <div className="flex gap-5">
            <Fingerprint className="mt-1 h-6 w-6 text-muted-foreground" />
            <div>
              <h3 className="font-bold">Entrar com biometria</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Use digital, rosto ou bloqueio do aparelho para abrir o app mobile e confirmar pagamentos.
              </p>
              <p className="mt-3 text-xs font-medium text-muted-foreground">
                {biometricStatusText}
              </p>
            </div>
          </div>
          {biometricBusy ? (
            <Loader2 className="mt-1 h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <Switch
              checked={biometricEnabled}
              disabled={!user?.id || (!biometricCanAttempt && !biometricEnabled)}
              onCheckedChange={(value) => void toggleBiometrics(value)}
            />
          )}
        </div>
      </Card>

      <Card>
        <div className="flex gap-5">
          <Mail className="mt-1 h-6 w-6 text-muted-foreground" />
          <div className="flex-1 space-y-4">
            <div><h3 className="font-bold">E-mail de acesso</h3><p className="text-sm text-muted-foreground">Atual: {user?.email}</p></div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input type="email" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} placeholder="Novo e-mail" />
              <Button onClick={() => void changeEmail()} disabled={saving === 'email'}>{saving === 'email' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Alterar'}</Button>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex gap-5">
          <Phone className="mt-1 h-6 w-6 text-muted-foreground" />
          <div className="flex-1 space-y-4">
            <div><h3 className="font-bold">Telefone de contato</h3><p className="text-sm text-muted-foreground">Atual: {profile?.phone || 'não cadastrado'}. Não será usado para MFA ou SMS.</p></div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input value={newPhone} onChange={(event) => setNewPhone(event.target.value)} placeholder="+55 (47) 98873-0611" />
              <Button onClick={() => void changePhone()} disabled={saving === 'phone'}>{saving === 'phone' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}</Button>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex gap-5">
          <KeyRound className="mt-1 h-6 w-6 text-muted-foreground" />
          <div className="flex-1 space-y-4">
            <div><h3 className="font-bold">Senha</h3><p className="text-sm text-muted-foreground">Confirme a senha atual antes de substituí-la.</p></div>
            <div className="grid gap-3 md:grid-cols-3">
              <Input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Senha atual" />
              <Input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Nova senha" />
              <Input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirmar nova senha" />
            </div>
            <Button onClick={() => void changePassword()} disabled={saving === 'password'}>{saving === 'password' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Atualizar senha'}</Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <div><h3 className="font-bold">PIN financeiro</h3><p className="text-sm text-muted-foreground">{settings?.pin_hash ? 'PIN ativo para operações sensíveis.' : 'Crie um PIN de seis dígitos.'}</p></div>
          <Button variant="outline" onClick={() => setPinOpen(true)}>{settings?.pin_hash ? 'Alterar PIN' : 'Criar PIN'}</Button>
        </div>
      </Card>

      <SetPinModal open={pinOpen} onOpenChange={setPinOpen} onSuccess={() => void refetchFinancial()} />
    </div>
  );
};
