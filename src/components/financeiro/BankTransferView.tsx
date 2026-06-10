import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, KeyRound, Landmark, Loader2, LockKeyhole, Send, ShieldCheck, UserRound, Wallet } from "lucide-react";
import { toast } from "sonner";

import { SecureOperationPinDialog } from "@/components/financeiro/secure/SecureOperationPinDialog";
import { SecureOperationProcessing } from "@/components/financeiro/secure/SecureOperationProcessing";
import { SecureOperationSuccess } from "@/components/financeiro/secure/SecureOperationSuccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFinancialAccount } from "@/hooks/use-financial-account";
import { useNeuroFinanceBalance } from "@/hooks/use-neurofinance-balance";
import {
  type PayoutConsultation,
  type PayoutExecution,
  type RequestPayoutParams,
  useSecurePayout,
} from "@/hooks/use-neurofinance-payouts";
import { cn, formatCurrency } from "@/lib/utils";

type DestinationMode = "saved_bank" | "pix_key";
type PayoutStep = "setup" | "review" | "processing" | "success";
const wait = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

const parseMoneyToCents = (value: string) => {
  const normalized = value.includes(",")
    ? value.replace(/\./g, "").replace(",", ".")
    : value;
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? Math.round(numeric * 100) : 0;
};

const normalizeAccountType = (value?: string | null): "CONTA_CORRENTE" | "CONTA_POUPANCA" =>
  String(value || "").toUpperCase().includes("POUP") ? "CONTA_POUPANCA" : "CONTA_CORRENTE";

function maskDocument(value?: string | null) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 11) return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
  if (digits.length === 14) return `**.${digits.slice(2, 5)}.${digits.slice(5, 8)}/****-${digits.slice(-2)}`;
  return value || "Não informado";
}

export const BankTransferView = () => {
  const { data: balanceData } = useNeuroFinanceBalance();
  const { account } = useFinancialAccount();
  const { consult, authorize, execute, receipt } = useSecurePayout();
  const [step, setStep] = useState<PayoutStep>("setup");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<DestinationMode>("saved_bank");
  const [pixKey, setPixKey] = useState("");
  const [consultation, setConsultation] = useState<PayoutConsultation | null>(null);
  const [execution, setExecution] = useState<PayoutExecution | null>(null);
  const [pinOpen, setPinOpen] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const balance = balanceData?.balance || 0;

  const savedBankDestination = useMemo<RequestPayoutParams["destination"] | null>(() => {
    if (!account?.bank_code || !account?.bank_agency || !account?.bank_account) return null;
    const holder = account.bank_holder_name || account.holder_name || "Conta de repasse";
    return {
      type: "saved_bank",
      bank_code: account.bank_code,
      bank_name: account.bank_name || "Banco cadastrado",
      agency: account.bank_agency,
      account: account.bank_account,
      account_digit: account.bank_account_digit || "",
      account_type: normalizeAccountType(account.bank_account_type),
      holder_name: holder,
      holder_document: account.bank_holder_cpf_cnpj || account.cpf_cnpj || "",
      summary: `${holder} · Ag ${account.bank_agency} Conta ${account.bank_account}${account.bank_account_digit || ""}`,
    };
  }, [account]);

  const amountInCents = parseMoneyToCents(amount);
  const selectedDestination: RequestPayoutParams["destination"] | null = mode === "saved_bank"
    ? savedBankDestination
    : { type: "pix_key", pix_key: pixKey.trim(), summary: pixKey.trim() };
  const canContinue = amountInCents > 0 && Boolean(mode === "saved_bank" ? savedBankDestination : pixKey.trim().length >= 5);

  const reset = () => {
    setStep("setup");
    setAmount("");
    setPixKey("");
    setConsultation(null);
    setExecution(null);
    setPinOpen(false);
    setPinError(null);
    consult.reset();
    authorize.reset();
    execute.reset();
  };

  const handleConsult = async () => {
    if (!selectedDestination || amountInCents <= 0) return toast.error("Confira o valor e o destino do saque.");
    try {
      const response = await consult.mutateAsync({ amount: amountInCents, destination: selectedDestination });
      setConsultation(response.consultation);
      setStep("review");
    } catch {
      // The hook shows the provider validation message.
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
      const message = error instanceof Error ? error.message : "Não foi possível autorizar o saque.";
      if (!authorized) {
        setPinError(message);
        return;
      }
      setStep("review");
    }
  };

  const destination = consultation?.destination || {};

  return (
    <div className="mx-auto max-w-4xl py-4">
      <AnimatePresence mode="wait">
        {step === "setup" && (
          <motion.div key="setup" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mx-auto max-w-xl space-y-8">
            <div className="space-y-2 text-center">
              <h3 className="text-2xl font-black uppercase tracking-tight">Sacar fundos</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Saldo exibido: {formatCurrency(balance)} · Confirmaremos novamente na revisão</p>
            </div>
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="ml-1 text-[10px] font-black uppercase tracking-widest">Quanto deseja sacar?</Label>
                <div className="relative"><span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-light text-zinc-300">R$</span><Input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} className="h-20 rounded-[24px] border-zinc-200 bg-zinc-50 pl-16 pr-6 text-4xl font-black dark:border-white/10 dark:bg-white/[0.02]" placeholder="0,00" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2 rounded-[24px] border border-zinc-200/70 bg-white/60 p-1.5 dark:border-white/10 dark:bg-white/[0.02]">
                {[{ id: "saved_bank" as const, label: "Conta cadastrada", icon: Landmark }, { id: "pix_key" as const, label: "Outra conta por Pix", icon: Send }].map((item) => (
                  <button key={item.id} type="button" onClick={() => setMode(item.id)} className={cn("flex h-12 items-center justify-center gap-2 rounded-[18px] text-[10px] font-black uppercase tracking-[0.14em] transition-all", mode === item.id ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/[0.06]")}>
                    <item.icon className="h-4 w-4" /> {item.label}
                  </button>
                ))}
              </div>
              {mode === "saved_bank" ? (
                savedBankDestination ? (
                  <div className="flex w-full items-center justify-between rounded-2xl bg-zinc-950 p-4 text-left text-white dark:bg-white dark:text-black">
                    <div className="flex items-center gap-4"><Landmark className="h-5 w-5" /><div><p className="text-[11px] font-black uppercase">{savedBankDestination.holder_name}</p><p className="text-[9px] opacity-65">Ag {savedBankDestination.agency} Conta {savedBankDestination.account}{savedBankDestination.account_digit}</p></div></div><Check className="h-4 w-4" />
                  </div>
                ) : <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-center text-xs font-semibold text-amber-700 dark:text-amber-300">Cadastre uma conta bancária em Ajustes NeuroFinance.</div>
              ) : (
                <div className="relative"><KeyRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" /><Input value={pixKey} onChange={(event) => setPixKey(event.target.value)} placeholder="CPF, e-mail, telefone ou chave aleatória" className="h-14 rounded-[20px] pl-11 text-sm font-bold dark:border-white/10 dark:bg-white/[0.035]" /></div>
              )}
            </div>
            <Button onClick={handleConsult} disabled={!canContinue || consult.isPending} className="h-16 w-full rounded-[24px] bg-zinc-900 text-[10px] font-black uppercase tracking-[0.2em] text-white dark:bg-white dark:text-black">
              {consult.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Consultar e revisar <ArrowRight className="ml-2 h-4 w-4" /></>}
            </Button>
          </motion.div>
        )}

        {step === "review" && consultation && (
          <motion.section key="review" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="overflow-hidden rounded-[32px] border border-zinc-200/70 bg-white/75 dark:border-white/[0.08] dark:bg-[#09090b]/80">
            <div className="border-b border-zinc-100 p-7 dark:border-white/5">
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-400">Destino validado</p>
              <h3 className="mt-2 text-xl font-black">Confira antes de sacar</h3>
              <p className="mt-1 text-xs text-zinc-500">{consultation.kind === "payout_pix" ? "A chave foi consultada diretamente no DICT pela Asaas." : "Os dados abaixo são da conta bancária cadastrada no NeuroFinance."}</p>
            </div>
            <div className="p-7">
              <div className="rounded-[26px] bg-white p-6 text-zinc-950 shadow-2xl"><p className="text-[10px] font-medium uppercase tracking-[0.22em] text-zinc-500">Valor do saque:</p><p className="mt-3 text-5xl font-black tracking-[-0.05em]">{formatCurrency(consultation.amount)}</p></div>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {[
                  { icon: UserRound, label: "Titular", value: String(destination.holder_name || "Não informado"), detail: maskDocument(String(destination.holder_document || "")) },
                  { icon: Landmark, label: "Instituição", value: String(destination.bank_name || "Banco cadastrado"), detail: consultation.kind === "payout_pix" ? "Chave validada via Asaas/DICT" : "Conta cadastrada pelo titular" },
                  { icon: Wallet, label: "Saldo confirmado", value: consultation.availableBalance == null ? "Indisponível" : formatCurrency(consultation.availableBalance), detail: "Consultado ao abrir esta revisão" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-4 rounded-[22px] border border-zinc-200/70 bg-zinc-50/70 p-4 dark:border-white/[0.07] dark:bg-white/[0.025]">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[15px] bg-white dark:bg-white/[0.06]"><item.icon className="h-4 w-4" /></div><div className="min-w-0"><p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">{item.label}</p><p className="mt-1 truncate text-sm font-black">{item.value}</p><p className="mt-0.5 text-[10px] text-zinc-500">{item.detail}</p></div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-2 rounded-[18px] border border-amber-500/15 bg-amber-500/[0.07] px-4 py-3 text-[10px] font-bold text-amber-800 dark:text-amber-200"><ShieldCheck className="h-4 w-4" /> O saque só será enviado depois da confirmação com seu PIN financeiro.</div>
              <div className="mt-6 grid gap-3 sm:grid-cols-[0.75fr_1.25fr]"><Button variant="ghost" onClick={() => { setStep("setup"); setConsultation(null); }} className="h-13 rounded-[18px] text-[10px] font-black uppercase tracking-widest">Corrigir dados</Button><Button onClick={() => { setPinError(null); setPinOpen(true); }} className="h-13 rounded-[18px] bg-zinc-950 text-[10px] font-black uppercase tracking-widest text-white dark:bg-white dark:text-zinc-950"><LockKeyhole className="mr-2 h-4 w-4" /> Confirmar saque</Button></div>
            </div>
          </motion.section>
        )}

        {step === "processing" && <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><SecureOperationProcessing /></motion.div>}

        {step === "success" && consultation && execution && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
            <SecureOperationSuccess
              title={execution.status === "paid" ? "Saque confirmado" : "Saque enviado com segurança"}
              description={execution.status === "paid" ? "A instituição confirmou a transferência." : "A solicitação acompanha a confirmação bancária."}
              amount={consultation.amount}
              recipient={consultation.destinationSummary}
              status={execution.status}
              receiptUrl={execution.receiptUrl}
              newActionLabel="Fazer outro saque"
              onNewAction={reset}
              onRefreshReceipt={async () => (await receipt.mutateAsync(consultation.id)).receiptUrl}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {consultation && <SecureOperationPinDialog open={pinOpen} onOpenChange={(open) => { setPinOpen(open); if (!open) setPinError(null); }} onConfirm={handlePinConfirm} recipient={consultation.destinationSummary} value={consultation.amount} actionLabel="o saque" isLoading={authorize.isPending} errorMessage={pinError} />}
    </div>
  );
};
