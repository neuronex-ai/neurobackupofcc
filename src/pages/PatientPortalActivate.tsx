import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActivatePatientPortal, usePatientPortalInvitePreview } from "@/hooks/use-patient-portal";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const TOKEN_STORAGE_KEY = "neuronex_patient_portal_invite_token";

const PatientPortalActivate = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => {
    const fromQuery = searchParams.get("token");
    if (fromQuery) return fromQuery;
    return window.localStorage.getItem(TOKEN_STORAGE_KEY) || "";
  }, [searchParams]);
  const [code, setCode] = useState("");
  const preview = usePatientPortalInvitePreview(token);
  const activate = useActivatePatientPortal();

  useEffect(() => {
    if (token) window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }, [token]);

  const handleCodeChange = (value: string) => {
    setCode(value.replace(/\D/g, "").slice(0, 6));
  };

  const handleActivate = () => {
    if (!token) {
      toast.error("Abra o link do convite antes de ativar o portal.");
      return;
    }
    if (code.length !== 6) {
      toast.error("Informe o codigo de 6 digitos.");
      return;
    }

    activate.mutate(
      { token, code },
      {
        onSuccess: () => {
          window.localStorage.removeItem(TOKEN_STORAGE_KEY);
          toast.success("Portal ativado com seguranca.");
          navigate("/portal", { replace: true });
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Nao foi possivel ativar o portal.");
        },
      },
    );
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10 text-foreground">
      <section className="w-full max-w-[560px] rounded-[34px] border border-border/55 bg-card/88 p-6 shadow-2xl shadow-black/5 sm:p-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-foreground text-background">
          <KeyRound className="h-6 w-6" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Ativar Portal</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Digite o codigo de 6 digitos enviado por e-mail. O e-mail da conta precisa ser o mesmo do convite.
        </p>

        {preview.data && (
          <div className="mt-6 rounded-3xl border border-border/50 bg-background p-4">
            <p className="text-sm font-medium text-muted-foreground">Convite para</p>
            <p className="mt-1 text-base font-semibold">{preview.data.patient.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{preview.data.patient.emailMasked}</p>
          </div>
        )}

        {preview.isError && (
          <div className="mt-6 rounded-3xl border border-amber-500/25 bg-amber-500/10 p-4">
            <p className="text-sm font-semibold">Nao encontramos um convite valido.</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Abra novamente o link recebido por e-mail ou solicite um novo envio.
            </p>
          </div>
        )}

        <label className="mt-6 block">
          <span className="text-sm font-semibold text-foreground">Codigo de ativacao</span>
          <Input
            value={code}
            onChange={(event) => handleCodeChange(event.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            className="mt-2 h-14 rounded-2xl text-center text-2xl font-semibold tracking-[0.3em]"
          />
        </label>

        <Button onClick={handleActivate} disabled={activate.isPending || preview.isLoading} className="mt-6 h-12 w-full rounded-2xl">
          {activate.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
          Ativar acesso
        </Button>
      </section>
    </main>
  );
};

export default PatientPortalActivate;
