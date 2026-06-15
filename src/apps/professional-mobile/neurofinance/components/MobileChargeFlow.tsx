import { useEffect, useMemo, useState } from "react";
import { Check, Copy, ExternalLink, Loader2, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePatients } from "@/hooks/use-patients";
import {
  MobileFinanceSheet,
  parseMoney,
  formatMoney,
} from "../../shared/MobileFinancePrimitives";
import {
  createNeuroFinanceCharge,
  type ChargeResult,
} from "../services/neurofinance-mobile-api";

type MobilePatientOption = {
  id: string;
  name?: string | null;
  cpf?: string | null;
  payer_cpf?: string | null;
  email?: string | null;
};

export function MobileChargeFlow({
  open,
  onOpenChange,
  onCompleted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted: () => void;
}) {
  const { data: patientData = [] } = usePatients();
  const patients = patientData as MobilePatientOption[];
  const [patientId, setPatientId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"pix" | "boleto" | "card" | "undefined">(
    "pix",
  );
  const [dueDate, setDueDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [description, setDescription] = useState("Sessão de psicoterapia");
  const [payerCpf, setPayerCpf] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ChargeResult | null>(null);

  const patient = useMemo(
    () => patients.find((item) => item.id === patientId),
    [patientId, patients],
  );
  useEffect(() => {
    setPayerCpf(patient?.cpf || patient?.payer_cpf || "");
    setPayerEmail(patient?.email || "");
  }, [patient]);

  const value = parseMoney(amount);
  const payerDocument = payerCpf.replace(/\D/g, "");
  const valid = Boolean(patientId) && value > 0 && Boolean(dueDate) && payerDocument.length >= 11;

  const submit = async () => {
    if (!valid || !patient) return;
    setBusy(true);
    try {
      const data = await createNeuroFinanceCharge({
        patient_id: patient.id,
        amount: Math.round(value * 100),
        payment_method: method,
        description: description.trim() || "Cobrança NeuroFinance",
        due_date: dueDate,
        patient_name: patient.name || "Paciente",
        patient_cpf: payerDocument,
        patient_email: payerEmail.trim() || undefined,
      });
      setResult(data);
      onCompleted();
      toast.success("Cobrança criada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao criar cobrança.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async (valueToCopy?: string | null) => {
    if (!valueToCopy) return;
    await navigator.clipboard.writeText(valueToCopy);
    toast.success("Código copiado.");
  };

  const reset = () => {
    setResult(null);
    setPatientId("");
    setAmount("");
  };

  return (
    <MobileFinanceSheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
      bodyClassName="pb-[calc(28px+env(safe-area-inset-bottom))]"
    >
        {result ? (
          <div className="py-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background">
              <Check className="h-6 w-6" />
            </div>
            <div className="mt-5 text-center">
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                Cobrança preparada
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                {formatMoney(result.amount / 100)}
              </h2>
              <p className="mt-2 text-xs text-muted-foreground">
                Envie o link ou código ao paciente.
              </p>
            </div>

            {result.pix_qr_code ? (
              <img
                alt="QR Code Pix"
                src={
                  result.pix_qr_code.startsWith("data:")
                    ? result.pix_qr_code
                    : `data:image/png;base64,${result.pix_qr_code}`
                }
                className="mx-auto mt-7 h-48 w-48 rounded-[24px] bg-white p-3"
              />
            ) : null}

            <div className="mt-7 space-y-3">
              {result.pix_copy_paste ? (
                <Button
                  variant="outline"
                  onClick={() => void copy(result.pix_copy_paste)}
                  className="h-[52px] w-full rounded-[18px]"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar Pix Copia e Cola
                </Button>
              ) : null}
              {result.checkout_url ? (
                <Button
                  variant="outline"
                  onClick={() => window.open(result.checkout_url!, "_blank", "noopener")}
                  className="h-[52px] w-full rounded-[18px]"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir página da cobrança
                </Button>
              ) : null}
              {result.bank_slip_url ? (
                <Button
                  variant="outline"
                  onClick={() =>
                    window.open(result.bank_slip_url!, "_blank", "noopener")
                  }
                  className="h-[52px] w-full rounded-[18px]"
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  Abrir boleto
                </Button>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            <div className="mt-7">
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                NeuroFinance
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                Criar cobrança
              </h2>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Gere uma cobrança vinculada ao paciente e ao controle financeiro do consultório.
              </p>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Paciente
                </span>
                <select
                  value={patientId}
                  onChange={(event) => setPatientId(event.target.value)}
                  className="mt-2 h-[52px] w-full rounded-[18px] border border-border/50 bg-card px-4 text-sm outline-none"
                >
                  <option value="">Selecione</option>
                  {patients.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name || "Paciente"}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Valor
                </span>
                <Input
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  inputMode="decimal"
                  placeholder="0,00"
                  className="mt-2 h-14 rounded-[18px] border-border/50 bg-card text-xl font-semibold"
                />
              </label>

              <div className="grid grid-cols-1 gap-4">
                <label className="block">
                  <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    CPF ou CNPJ do pagador
                  </span>
                  <Input
                    value={payerCpf}
                    onChange={(event) => setPayerCpf(event.target.value)}
                    inputMode="numeric"
                    placeholder="Documento usado na cobrança"
                    className="mt-2 h-[52px] rounded-[18px] border-border/50 bg-card"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    E-mail do pagador
                  </span>
                  <Input
                    value={payerEmail}
                    onChange={(event) => setPayerEmail(event.target.value)}
                    inputMode="email"
                    placeholder="Opcional"
                    className="mt-2 h-[52px] rounded-[18px] border-border/50 bg-card"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Forma de recebimento
                </span>
                <select
                  value={method}
                  onChange={(event) => setMethod(event.target.value as typeof method)}
                  className="mt-2 h-[52px] w-full rounded-[18px] border border-border/50 bg-card px-4 text-sm outline-none"
                >
                  <option value="pix">Pix</option>
                  <option value="boleto">Boleto</option>
                  <option value="card">Cartão</option>
                  <option value="undefined">Paciente escolhe</option>
                </select>
              </label>

              <label className="block">
                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Vencimento
                </span>
                <Input
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  type="date"
                  className="mt-2 h-[52px] rounded-[18px] border-border/50 bg-card"
                />
              </label>

              <label className="block">
                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Descrição
                </span>
                <Input
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="mt-2 h-[52px] rounded-[18px] border-border/50 bg-card"
                />
              </label>
            </div>

            <Button
              disabled={!valid || busy}
              onClick={() => void submit()}
              className="mt-6 h-14 w-full rounded-[20px] text-xs font-semibold uppercase tracking-[0.16em]"
            >
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Gerar cobrança
            </Button>
          </>
        )}
    </MobileFinanceSheet>
  );
}
