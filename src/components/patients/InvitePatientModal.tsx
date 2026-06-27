import { useMemo } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { useInvitePatient } from "@/hooks/use-invite-patient";
import {
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MailPlus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface InvitePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: {
    id?: string;
    name?: string | null;
    email?: string | null;
  } | null;
}

const portalFeatures = [
  "Agenda compartilhada e historico simples de sessoes",
  "Diario de humor e anotacoes do paciente",
  "Documentos liberados explicitamente pelo psicologo",
  "Financeiro do paciente com links de pagamento",
];

const firstName = (name?: string | null) => name?.trim().split(/\s+/)[0] || "paciente";

export const InvitePatientModal = ({ isOpen, onClose, patient }: InvitePatientModalProps) => {
  const { mutate: invitePatient, isPending, data, reset } = useInvitePatient();

  const patientName = firstName(patient?.name);
  const canSend = Boolean(patient?.id && patient?.email);
  const isLinked = data?.status === "linked";
  const sentAtLabel = useMemo(() => {
    if (!data?.expiresAt) return null;
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(data.expiresAt));
  }, [data?.expiresAt]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset();
      onClose();
    }
  };

  const handleSendInvite = () => {
    if (!patient?.id) return;
    invitePatient({ patientId: patient.id });
  };

  const copyToClipboard = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copiado.`);
  };

  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={handleOpenChange}
      className="overflow-hidden rounded-[28px] border-border/50 p-0 sm:max-w-[560px]"
      drawerClassName="border-t border-border/20 bg-background"
    >
      <div className="bg-background">
        <div className="border-b border-border/50 bg-muted/25 px-6 py-5 sm:px-7">
          <DialogHeader className="space-y-3 text-left">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-background shadow-sm">
                <MailPlus className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-xl font-semibold tracking-tight">
                  Convidar paciente
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Envie o acesso seguro ao Portal do Paciente para {patientName}.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="space-y-5 px-6 py-6 sm:px-7">
          {!canSend && (
            <Alert className="rounded-2xl border-amber-500/25 bg-amber-500/10">
              <Lock className="h-4 w-4 text-amber-500" />
              <AlertTitle className="text-sm font-semibold">E-mail obrigatorio</AlertTitle>
              <AlertDescription className="text-sm text-muted-foreground">
                Cadastre um e-mail no prontuario antes de enviar o convite do portal.
              </AlertDescription>
            </Alert>
          )}

          {data && (
            <Alert className="rounded-2xl border-emerald-500/25 bg-emerald-500/10">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <AlertTitle className="text-sm font-semibold">
                {isLinked ? "Paciente conectado" : "Convite enviado"}
              </AlertTitle>
              <AlertDescription className="text-sm text-muted-foreground">
                {isLinked
                  ? "Este paciente ja possui vinculo ativo com seu portal."
                  : `O codigo expira junto do convite${sentAtLabel ? ` em ${sentAtLabel}` : ""}.`}
              </AlertDescription>
            </Alert>
          )}

          {data?.activationCode && (
            <section className="rounded-3xl border border-emerald-500/25 bg-emerald-500/[0.08] p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Codigo de ativacao</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Mostrado apenas neste envio. O paciente tambem recebe este codigo por e-mail.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <code className="rounded-2xl bg-background px-4 py-3 text-2xl font-semibold tracking-[0.24em] text-foreground">
                    {data.activationCode}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 rounded-2xl"
                    onClick={() => copyToClipboard(data.activationCode!, "Codigo")}
                    aria-label="Copiar codigo de ativacao"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {data.portalUrl && (
                <div className="mt-4 flex flex-col gap-2 rounded-2xl bg-background/80 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="truncate text-sm text-muted-foreground">{data.portalUrl}</span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => copyToClipboard(data.portalUrl!, "Link")}
                    >
                      <Copy className="mr-2 h-3.5 w-3.5" />
                      Copiar
                    </Button>
                    <Button asChild type="button" variant="outline" size="sm" className="rounded-xl">
                      <a href={data.portalUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-2 h-3.5 w-3.5" />
                        Abrir
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </section>
          )}

          <section className="rounded-3xl border border-border/60 bg-card/70 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{patient?.name || "Paciente sem nome"}</p>
                <p className="mt-1 truncate text-sm text-muted-foreground">{patient?.email || "E-mail nao cadastrado"}</p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                <Mail className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="flex gap-3 rounded-2xl bg-muted/45 p-3">
                <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <p className="text-sm leading-relaxed text-muted-foreground">
                  O e-mail inclui um link publico e um codigo numerico de ativacao com validade de 7 dias.
                </p>
              </div>
              <div className="flex gap-3 rounded-2xl bg-muted/45 p-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <p className="text-sm leading-relaxed text-muted-foreground">
                  O paciente so acessa dados apos login, codigo correto e vinculo ativo com este prontuario.
                </p>
              </div>
            </div>
          </section>

          <section className="grid gap-2 sm:grid-cols-2">
            {portalFeatures.map((feature) => (
              <div key={feature} className="flex min-h-14 items-start gap-3 rounded-2xl border border-border/40 bg-background p-3">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-sm leading-snug text-muted-foreground">{feature}</span>
              </div>
            ))}
          </section>
        </div>

        <DialogFooter className="gap-3 border-t border-border/50 bg-muted/20 px-6 py-5 sm:px-7">
          <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={isPending} className="h-11 rounded-xl">
            Cancelar
          </Button>
          <Button onClick={handleSendInvite} disabled={!canSend || isPending || isLinked} className="h-11 rounded-xl">
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : data ? (
              <RefreshCw className="mr-2 h-4 w-4" />
            ) : (
              <Clock3 className="mr-2 h-4 w-4" />
            )}
            {data ? "Reenviar codigo" : "Convidar"}
          </Button>
        </DialogFooter>
      </div>
    </ResponsiveModal>
  );
};
