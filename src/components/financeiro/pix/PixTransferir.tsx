import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, KeyRound, Landmark, Loader2, LockKeyhole, Send, ShieldCheck, UserRound, Wallet } from "lucide-react";
import { toast } from "sonner";

import { SecureOperationPinDialog } from "@/components/financeiro/secure/SecureOperationPinDialog";
import { SecureOperationProcessing } from "@/components/financeiro/secure/SecureOperationProcessing";
import { SecureOperationSuccess } from "@/components/financeiro/secure/SecureOperationSuccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type PayoutConsultation, type PayoutExecution, useSecurePayout } from "@/hooks/use-neurofinance-payouts";
import { formatDocumentInput, formatMoneyInput, formatPixKeyInput, moneyInputToCents, normalizePixKeyInput, type PixKeyInputType } from "@/lib/financial-input";
import { cn, formatCurrency } from "@/lib/utils";

type TransferStep = "setup" | "review" | "processing" | "success";
type KeyType = Exclude<PixKeyInputType, "auto">;
const wait = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

const keyTypes: Array<{ id: KeyType; label: string }> = [
  { id: "cpf", label: "CPF" },
  { id: "cnpj", label: "CNPJ" },
  { id: "email", label: "E-mail" },
  { id: "telefone", label: "Telefone" },
  { id: "evp", label: "Aleatória" },
];

export function PixTransferir() {
  const { consult, authorize, execute, receipt } = useSecurePayout();
  const [step, setStep] = useState<TransferStep>("setup");
  const [keyType, setKeyType] = useState<KeyType>("cpf");
  const [pixKey, setPixKey] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [consultation, setConsultation] = useState<PayoutConsultation | null>(null);
  const [execution, setExecution] = useState<PayoutExecution | null>(null);
  const [pinOpen, setPinOpen] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const amountInCents = moneyInputToCents(amount);
  const destination = consultation?.destination || {};

  const reset = () => {
    setStep("setup");
    setPixKey("");
    setAmount("");
    setDescription("");
    setConsultation(null);
    setExecution(null);
    setPinOpen(false);
    setPinError(null);
    consult.reset();
    authorize.reset();
    execute.reset();
  };

  const handleConsult = async () => {
    const normalizedKey = normalizePixKeyInput(pixKey, keyType);
    if (!normalizedKey || amountInCents <= 0) return toast.error("Confira a chave Pix e o valor da transferência.");
    try {
      const response = await consult.mutateAsync({
        purpose: "transfer",
        amount: amountInCents,
        description: description.trim() || undefined,
        destination: { type: "pix_key", pix_key: normalizedKey, summary: normalizedKey },
      });
      setConsultation(response.consultation);
      setStep("review");
    } catch {
      // Provider validation is shown by the hook.
    }
  };

  const handlePinConfirm = async (pin: string) => {
    if (!consultation) return;
    setPinError(null);
    let authorized = false;
    try {
      const authorization = await authorize.mutateAsync({ requestId: consultation.id, pin });
      authorized = true;
      setConsultation(authorization.consultation);
      setPinOpen(false);
      setStep("processing");
      const [result] = await Promise.all([execute.mutateAsync(consultation.id), wait(3400)]);
      setExecution(result);
      setStep("success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível autorizar esta transferência.";
      if (!authorized) return setPinError(message);
      setStep("review");
    }
  };

  return (
    <div className="mx-auto max-w-4xl py-4">
      <AnimatePresence mode="wait">
        {step === "setup" && (
          <motion.div key="setup" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mx-auto max-w-2xl space-y-7">
            <section className="rounded-[30px] border border-zinc-200/70 bg-white/70 p-7 dark:border-white/[0.08] dark:bg-white/[0.025]">
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400">Transferência protegida</p>
              <h3 className="mt-2 text-2xl font-black">Consulte o destino antes de transferir</h3>
              <p className="mt-2 text-sm text-zinc-500">Confirmaremos titular, documento e instituição no DICT antes de solicitar seu PIN.</p>
              <div className="mt-7 grid grid-cols-5 gap-2">
                {keyTypes.map((item) => (
                  <button key={item.id} type="button" onClick={() => { setKeyType(item.id); setPixKey(""); }} className={cn("h-10 rounded-xl text-[9px] font-black uppercase tracking-wider transition", keyType === item.id ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" : "bg-zinc-100 text-zinc-500 dark:bg-white/5")}>{item.label}</button>
                ))}
              </div>
              <div className="relative mt-4">
                <KeyRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input value={pixKey} onChange={(event) => setPixKey(formatPixKeyInput(event.target.value, keyType))} placeholder="Chave Pix do destinatário" className="h-14 rounded-[20px] pl-11 text-sm font-bold dark:border-white/10 dark:bg-white/[0.035]" />
              </div>
              <div className="relative mt-4">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-light text-zinc-400">R$</span>
                <Input inputMode="decimal" value={amount} onChange={(event) => setAmount(formatMoneyInput(event.target.value))} placeholder="0,00" className="h-16 rounded-[20px] pl-14 text-3xl font-black dark:border-white/10 dark:bg-white/[0.035]" />
              </div>
              <Input value={description} maxLength={140} onChange={(event) => setDescription(event.target.value)} placeholder="Descrição opcional" className="mt-4 h-13 rounded-[18px] dark:border-white/10 dark:bg-white/[0.035]" />
              <Button onClick={handleConsult} disabled={!pixKey || amountInCents <= 0 || consult.isPending} className="mt-6 h-15 w-full rounded-[22px] bg-zinc-950 text-[10px] font-black uppercase tracking-[0.2em] text-white dark:bg-white dark:text-zinc-950">
                {consult.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Consultar e revisar <ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>
            </section>
          </motion.div>
        )}

        {step === "review" && consultation && (
          <motion.section key="review" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="overflow-hidden rounded-[32px] border border-zinc-200/70 bg-white/75 dark:border-white/[0.08] dark:bg-[#09090b]/80">
            <div className="border-b border-zinc-100 p-7 dark:border-white/5">
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-400">Destino Pix validado</p>
              <h3 className="mt-2 text-xl font-black">Confira antes de transferir</h3>
              <p className="mt-1 text-xs text-zinc-500">A chave foi consultada diretamente no DICT pela Asaas.</p>
            </div>
            <div className="p-7">
              <div className="rounded-[26px] bg-white p-6 text-zinc-950 shadow-2xl"><p className="text-[10px] font-medium uppercase tracking-[0.22em] text-zinc-500">Valor da transferência:</p><p className="mt-3 text-5xl font-black tracking-[-0.05em]">{formatCurrency(consultation.amount)}</p></div>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {[
                  { icon: UserRound, label: "Titular", value: String(destination.holder_name || "Não informado"), detail: formatDocumentInput(String(destination.holder_document || "")) || "Documento não informado" },
                  { icon: Landmark, label: "Instituição", value: String(destination.bank_name || "Instituição Pix"), detail: "Chave validada via Asaas/DICT" },
                  { icon: Wallet, label: "Saldo confirmado", value: consultation.availableBalance == null ? "Indisponível" : formatCurrency(consultation.availableBalance), detail: "Consultado nesta revisão" },
                ].map((item) => <div key={item.label} className="flex items-center gap-4 rounded-[22px] border border-zinc-200/70 bg-zinc-50/70 p-4 dark:border-white/[0.07] dark:bg-white/[0.025]"><div className="flex h-10 w-10 items-center justify-center rounded-[15px] bg-white dark:bg-white/[0.06]"><item.icon className="h-4 w-4" /></div><div className="min-w-0"><p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">{item.label}</p><p className="mt-1 truncate text-sm font-black">{item.value}</p><p className="mt-0.5 text-[10px] text-zinc-500">{item.detail}</p></div></div>)}
              </div>
              <div className="mt-5 flex items-center gap-2 rounded-[18px] border border-amber-500/15 bg-amber-500/[0.07] px-4 py-3 text-[10px] font-bold text-amber-800 dark:text-amber-200"><ShieldCheck className="h-4 w-4" /> A transferência só será enviada depois da confirmação com seu PIN financeiro.</div>
              <div className="mt-6 grid gap-3 sm:grid-cols-[0.75fr_1.25fr]"><Button variant="ghost" onClick={() => { setStep("setup"); setConsultation(null); }} className="h-13 rounded-[18px] text-[10px] font-black uppercase tracking-widest">Corrigir dados</Button><Button onClick={() => { setPinError(null); setPinOpen(true); }} className="h-13 rounded-[18px] bg-zinc-950 text-[10px] font-black uppercase tracking-widest text-white dark:bg-white dark:text-zinc-950"><LockKeyhole className="mr-2 h-4 w-4" /> Confirmar transferência</Button></div>
            </div>
          </motion.section>
        )}

        {step === "processing" && <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><SecureOperationProcessing /></motion.div>}
        {step === "success" && consultation && execution && <motion.div key="success" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}><SecureOperationSuccess title={execution.status === "paid" ? "Transferência confirmada" : "Transferência enviada com segurança"} description={execution.status === "paid" ? "A instituição confirmou a transferência Pix." : "A solicitação acompanha a confirmação bancária."} amount={consultation.amount} recipient={consultation.destinationSummary} status={execution.status} receiptUrl={execution.receiptUrl} newActionLabel="Fazer outra transferência" onNewAction={reset} onRefreshReceipt={async () => (await receipt.mutateAsync(consultation.id)).receiptUrl} /></motion.div>}
      </AnimatePresence>

      {consultation && <SecureOperationPinDialog open={pinOpen} onOpenChange={(open) => { setPinOpen(open); if (!open) setPinError(null); }} onConfirm={handlePinConfirm} recipient={consultation.destinationSummary} value={consultation.amount} actionLabel="a transferência" isLoading={authorize.isPending} errorMessage={pinError} />}
    </div>
  );
}
