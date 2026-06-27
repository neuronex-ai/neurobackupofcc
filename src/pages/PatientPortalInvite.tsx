import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/SessionContextProvider";
import { usePatientPortalInvitePreview } from "@/hooks/use-patient-portal";
import { CalendarClock, CheckCircle2, KeyRound, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const storeInviteToken = (token: string) => {
  window.localStorage.setItem("neuronex_patient_portal_invite_token", token);
};

const PatientPortalInvite = () => {
  const { token = "" } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const preview = usePatientPortalInvitePreview(token);

  useEffect(() => {
    if (token) storeInviteToken(token);
  }, [token]);

  const goToActivation = () => {
    if (!token) return;
    storeInviteToken(token);
    if (user) navigate(`/portal/ativar?token=${encodeURIComponent(token)}`);
    else navigate("/auth?role=patient");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10 text-foreground">
      <section className="w-full max-w-[680px] overflow-hidden rounded-[34px] border border-border/55 bg-card/88 shadow-2xl shadow-black/5">
        <div className="border-b border-border/50 bg-muted/25 px-6 py-6 sm:px-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-foreground text-background">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">Convite para o Portal NeuroNex</h1>
            <p className="mt-3 max-w-[560px] text-sm leading-relaxed text-muted-foreground">
            Acesse sua área segura para acompanhar agenda, documentos compartilhados, diário e financeiro.
          </p>
        </div>

        <div className="space-y-5 px-6 py-6 sm:px-8">
          {preview.isLoading && (
            <div className="flex min-h-40 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          )}

          {preview.isError && (
            <div className="rounded-3xl border border-amber-500/25 bg-amber-500/10 p-5">
              <p className="text-base font-semibold">Convite indisponível</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                O link pode ter expirado, ter sido copiado incompleto ou ter sido substituído por um convite mais recente.
                Se você ainda tem o código recebido por e-mail, entre pelo portal e tente a ativação por código.
              </p>
              <Button onClick={() => navigate("/auth?role=patient")} className="mt-4 h-11 rounded-2xl">
                Entrar no Portal do Paciente
              </Button>
            </div>
          )}

          {preview.data && (
            <>
              <div className="rounded-3xl border border-border/50 bg-background p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Paciente</p>
                    <p className="mt-1 text-xl font-semibold">{preview.data.patient.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{preview.data.patient.emailMasked}</p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="mt-5 rounded-2xl bg-muted/45 p-4">
                  <p className="text-sm font-medium text-muted-foreground">Profissional</p>
                  <p className="mt-1 text-base font-semibold">{preview.data.professional.name}</p>
                  {preview.data.professional.clinicName && (
                    <p className="mt-1 text-sm text-muted-foreground">{preview.data.professional.clinicName}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl border border-border/50 bg-background p-4">
                  <KeyRound className="h-5 w-5 text-muted-foreground" />
                  <p className="mt-3 text-sm font-semibold">Código por e-mail</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Informe o código de 6 dígitos para ativar.</p>
                </div>
                <div className="rounded-3xl border border-border/50 bg-background p-4">
                  <CalendarClock className="h-5 w-5 text-muted-foreground" />
                  <p className="mt-3 text-sm font-semibold">Validade</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">O convite expira em 7 dias.</p>
                </div>
                <div className="rounded-3xl border border-border/50 bg-background p-4">
                  <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                  <p className="mt-3 text-sm font-semibold">Privacidade</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Notas clínicas internas não são exibidas.</p>
                </div>
              </div>

              <Button onClick={goToActivation} className="h-12 w-full rounded-2xl">
                {user ? "Inserir código de ativação" : "Entrar ou criar conta de paciente"}
              </Button>
            </>
          )}
        </div>
      </section>
    </main>
  );
};

export default PatientPortalInvite;
