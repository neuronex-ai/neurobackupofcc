import { useAuth } from "@/components/auth/SessionContextProvider";
import { TwoFactorModal } from "@/components/auth/TwoFactorModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useFinancialSettings } from "@/hooks/use-financial-settings";
import { useProfile } from "@/hooks/use-profile";

import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Key, Loader2, Mail, Phone, ShieldCheck, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SetPinModal } from "./SetPinModal";

export const SecuritySettingsPanel = () => {
  const { settings, isLoading: isLoadingSettings, refetch } = useFinancialSettings();
  const { user } = useAuth();
  const { profile, isLoading: isLoadingProfile, refetch: refetchProfile } = useProfile();

  const [isSetPinModalOpen, setIsSetPinModalOpen] = useState(false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [twoFAMode, setTwoFAMode] = useState<"enable" | "verify">("enable");

  // Form states
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  // Loading states
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [isChangingPhone, setIsChangingPhone] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isToggling2FA, setIsToggling2FA] = useState(false);

  // 2FA state
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  // useTwilioSms removed

  useEffect(() => {
    if (profile?.two_factor_enabled !== undefined) {
      setIs2FAEnabled(profile.two_factor_enabled);
    }
  }, [profile]);

  if (isLoadingSettings || isLoadingProfile) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const hasPin = !!settings?.pin_hash;
  const userEmail = user?.email || "";
  const userPhone = profile?.phone || "";

  // === HANDLERS ===
  const handleChangeEmail = async () => {
    if (!newEmail.trim() || !newEmail.includes("@")) {
      toast.error("Digite um email válido");
      return;
    }

    setIsChangingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });

      if (error) throw error;

      toast.success("Email de confirmação enviado para o novo endereço");
      setNewEmail("");
    } catch (error: any) {
      toast.error(error.message || "Erro ao alterar email");
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handleChangePhone = async () => {
    if (!newPhone.trim()) {
      toast.error("Digite um telefone válido");
      return;
    }

    // Open 2FA modal to verify new phone
    setTwoFAMode("verify");
    setIs2FAModalOpen(true);
  };

  const handlePhoneVerified = async () => {
    setIsChangingPhone(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ phone: newPhone })
        .eq('id', user?.id);

      if (error) throw error;

      toast.success("Telefone atualizado com sucesso!");
      setNewPhone("");
      refetchProfile();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar telefone");
    } finally {
      setIsChangingPhone(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;

      toast.success("Senha alterada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Erro ao alterar senha");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleToggle2FA = async (enabled: boolean) => {
    if (!userPhone) {
      toast.error("Cadastre um telefone antes de ativar 2FA");
      return;
    }

    if (enabled) {
      // Open modal to verify phone before enabling
      setTwoFAMode("enable");
      setIs2FAModalOpen(true);
    } else {
      // Disable 2FA
      setIsToggling2FA(true);
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ two_factor_enabled: false })
          .eq('id', user?.id);

        if (error) throw error;

        setIs2FAEnabled(false);
        toast.success("Autenticação de dois fatores desativada");
        refetchProfile();
      } catch (error: any) {
        toast.error(error.message || "Erro ao desativar 2FA");
      } finally {
        setIsToggling2FA(false);
      }
    }
  };

  const handle2FAEnabled = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ two_factor_enabled: true })
        .eq('id', user?.id);

      if (error) throw error;

      setIs2FAEnabled(true);
      toast.success("Autenticação de dois fatores ativada!");
      refetchProfile();
    } catch (error: any) {
      toast.error(error.message || "Erro ao ativar 2FA");
    }
  };

  // === RENDER ===
  return (
    <>
      <SetPinModal
        open={isSetPinModalOpen}
        onOpenChange={setIsSetPinModalOpen}
        onSuccess={() => refetch()}
      />

      <TwoFactorModal
        open={is2FAModalOpen}
        onOpenChange={setIs2FAModalOpen}
        phone={twoFAMode === "verify" ? newPhone : userPhone}
        email={userEmail}
        mode={twoFAMode}
        onSuccess={twoFAMode === "enable" ? handle2FAEnabled : handlePhoneVerified}
      />

      <div className="space-y-8 max-w-4xl animate-fade-in">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Segurança da Conta</h2>
          <p className="text-base text-muted-foreground">
            Gerencie email, telefone, senha e autenticação de dois fatores.
          </p>
        </div>

        <div className="h-px w-full bg-border/30" />

        {/* === 2FA Section === */}
        <div className="group relative overflow-hidden rounded-[24px] border border-border/50 dark:border-white/5 bg-card dark:bg-[#0F0F11] p-6 md:p-8 transition-all hover:border-border dark:hover:border-white/10">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="relative z-10 flex flex-col items-center md:flex-row md:items-start justify-between gap-6 text-center md:text-left">
            <div className="flex flex-col items-center md:flex-row md:items-start gap-4 md:gap-6 w-full md:w-auto">
              <div className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center border transition-all duration-500 shrink-0",
                is2FAEnabled
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                  : "bg-muted border-border text-muted-foreground"
              )}>
                <Smartphone className="h-7 w-7" />
              </div>

              <div className="space-y-2 w-full md:w-auto">
                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3 justify-center md:justify-start">
                  <h3 className="text-lg font-bold text-foreground">Autenticação de Dois Fatores</h3>
                  {is2FAEnabled && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      Ativo
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground max-w-md mx-auto md:mx-0">
                  Receba um código SMS ao fazer login para maior segurança. Requer telefone cadastrado.
                </p>
              </div>
            </div>

            <div className="mt-2 md:mt-0">
              <Switch
                checked={is2FAEnabled}
                onCheckedChange={handleToggle2FA}
                disabled={isToggling2FA || !userPhone}
              />
            </div>
          </div>
        </div>

        {/* === Email Section === */}
        <div className="relative overflow-hidden rounded-[24px] border border-border/50 dark:border-white/5 bg-card dark:bg-[#0F0F11] p-6 md:p-8">
          <div className="flex flex-col items-center md:flex-row md:items-start gap-6 text-center md:text-left">
            <div className="w-14 h-14 rounded-full flex items-center justify-center border border-border bg-muted/50 shrink-0">
              <Mail className="h-7 w-7 text-muted-foreground" />
            </div>

            <div className="flex-1 space-y-4 w-full">
              <div>
                <h3 className="text-lg font-bold text-foreground">Email</h3>
                <p className="text-sm text-muted-foreground">
                  Atual: <span className="text-foreground font-medium">{userEmail}</span>
                </p>
              </div>

              <div className="flex flex-col md:flex-row gap-3 w-full max-w-md mx-auto md:mx-0">
                <Input
                  placeholder="Novo email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="h-11 rounded-xl"
                />
                <Button
                  onClick={handleChangeEmail}
                  disabled={isChangingEmail || !newEmail}
                  className="h-11 px-6 rounded-xl w-full md:w-auto"
                >
                  {isChangingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : "Alterar"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* === Phone Section === */}
        <div className="relative overflow-hidden rounded-[24px] border border-border/50 dark:border-white/5 bg-card dark:bg-[#0F0F11] p-6 md:p-8">
          <div className="flex flex-col items-center md:flex-row md:items-start gap-6 text-center md:text-left">
            <div className="w-14 h-14 rounded-full flex items-center justify-center border border-border bg-muted/50 shrink-0">
              <Phone className="h-7 w-7 text-muted-foreground" />
            </div>

            <div className="flex-1 space-y-4 w-full">
              <div>
                <h3 className="text-lg font-bold text-foreground">Telefone</h3>
                <p className="text-sm text-muted-foreground">
                  {userPhone ? (
                    <>Atual: <span className="text-foreground font-medium">{userPhone}</span></>
                  ) : (
                    <span className="text-amber-500">Nenhum telefone cadastrado</span>
                  )}
                </p>
              </div>

              <div className="flex flex-col md:flex-row gap-3 w-full max-w-md mx-auto md:mx-0">
                <Input
                  placeholder="+55 (47) 98873-0611"
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="h-11 rounded-xl"
                />
                <Button
                  onClick={handleChangePhone}
                  disabled={isChangingPhone || !newPhone}
                  className="h-11 px-6 rounded-xl w-full md:w-auto"
                >
                  {isChangingPhone ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verificar"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* === Password Section === */}
        <div className="relative overflow-hidden rounded-[24px] border border-border/50 dark:border-white/5 bg-card dark:bg-[#0F0F11] p-6 md:p-8">
          <div className="flex flex-col items-center md:flex-row md:items-start gap-6 text-center md:text-left">
            <div className="w-14 h-14 rounded-full flex items-center justify-center border border-border bg-muted/50 shrink-0">
              <Key className="h-7 w-7 text-muted-foreground" />
            </div>

            <div className="flex-1 space-y-4 w-full">
              <div>
                <h3 className="text-lg font-bold text-foreground">Alterar Senha</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto md:mx-0">
                  Escolha uma senha forte com pelo menos 6 caracteres.
                </p>
              </div>

              <div className="grid gap-4 max-w-md w-full mx-auto md:mx-0">
                <div className="relative">
                  <Input
                    placeholder="Senha atual"
                    type={showPasswords ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="h-11 rounded-xl pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Input
                  placeholder="Nova senha"
                  type={showPasswords ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-11 rounded-xl"
                />
                <Input
                  placeholder="Confirmar nova senha"
                  type={showPasswords ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 rounded-xl"
                />
                <Button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="h-11 rounded-xl w-full"
                >
                  {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : "Alterar Senha"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* === Financial PIN Section === */}
        <div className="group relative overflow-hidden rounded-[24px] border border-border/50 dark:border-white/5 bg-card dark:bg-[#0F0F11] p-6 md:p-8 transition-all hover:border-border dark:hover:border-white/10">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="relative z-10 flex flex-col items-center md:flex-row md:items-center justify-between gap-6 text-center md:text-left">
            <div className="flex flex-col items-center md:flex-row md:items-center gap-6 w-full md:w-auto">
              <div className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center border transition-all duration-500 shrink-0",
                hasPin
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                  : "bg-muted border-border text-muted-foreground"
              )}>
                <ShieldCheck className="h-7 w-7" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">Cofre Financeiro</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto md:mx-0">
                  {hasPin
                    ? "Protegido por PIN de 6 dígitos."
                    : "Adicione proteção extra para saques e saldo."}
                </p>
              </div>
            </div>

            <Button
              onClick={() => setIsSetPinModalOpen(true)}
              variant="outline"
              className="h-11 px-6 rounded-xl w-full md:w-auto"
            >
              {hasPin ? "Alterar PIN" : "Configurar"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};