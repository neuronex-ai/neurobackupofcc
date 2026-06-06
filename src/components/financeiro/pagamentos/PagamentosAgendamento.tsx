import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Barcode, CheckCircle2, FileUp, Loader2, QrCode, ReceiptText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency } from "@/lib/utils";
import { formatBoletoValue, normalizeBoletoInput } from "@/lib/boleto";
import { useBoletoReader } from "@/hooks/use-boleto-reader";
import { useNeurofinanceBillPayments } from "@/hooks/use-neurofinance-bill-payments";
import { PixPagarCopiaCola } from "@/components/financeiro/pix/PixPagarCopiaCola";

type Tab = "boleto" | "pix";

export function PagamentosAgendamento() {
  const [tab, setTab] = useState<Tab>("boleto");
  const [input, setInput] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [dragging, setDragging] = useState(false);
  const { readFile, isReading } = useBoletoReader();
  const { simulate, create, list } = useNeurofinanceBillPayments();
  const normalized = useMemo(() => normalizeBoletoInput(input), [input]);
  const bill = simulate.data?.bill;

  const handleFile = async (file?: File) => {
    if (!file) return;
    const value = await readFile(file);
    if (!value) {
      toast.info("Não encontramos a numeração automaticamente. Você pode digitar a linha do boleto.");
      return;
    }
    setInput(value);
    toast.success("Numeração encontrada. Confira os dados antes de pagar.");
  };

  const handleValidate = () => {
    if (!normalized.isValid) {
      toast.error("Informe uma linha digitável ou código de barras válido.");
      return;
    }
    simulate.mutate(input);
  };

  const handlePay = () => {
    if (!normalized.isValid) return;
    create.mutate({
      input,
      scheduleDate: scheduleDate || undefined,
      value: typeof bill?.value === "number" ? bill.value : undefined,
      dueDate: typeof bill?.dueDate === "string" ? bill.dueDate : undefined,
      description: "Pagamento de boleto pelo NeuroFinance",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex w-fit rounded-[22px] border border-zinc-200/70 bg-white/70 p-1.5 shadow-sm backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]">
        {[
          { id: "boleto", label: "Pagar boleto", icon: Barcode },
          { id: "pix", label: "Pagar Pix", icon: QrCode },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id as Tab)}
            className={cn(
              "flex h-10 items-center gap-2 rounded-[16px] px-5 text-[10px] font-black uppercase tracking-[0.13em] transition-all",
              tab === item.id
                ? "bg-zinc-950 text-white shadow-lg dark:bg-white dark:text-zinc-950"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950 dark:hover:bg-white/8 dark:hover:text-white",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </div>

      {tab === "pix" ? (
        <PixPagarCopiaCola />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
          <section className="rounded-[28px] border border-zinc-200/70 bg-white/72 p-6 shadow-[0_24px_70px_-55px_rgba(0,0,0,0.35)] backdrop-blur-3xl dark:border-white/[0.08] dark:bg-[#0b0b0d]/76">
            <div className="mb-6">
              <h3 className="text-lg font-black text-zinc-950 dark:text-white">Pague boletos com o saldo da conta</h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Arraste o arquivo, anexe um PDF/imagem ou digite a linha do boleto.
              </p>
            </div>

            <label
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                handleFile(event.dataTransfer.files?.[0]);
              }}
              className={cn(
                "flex min-h-[170px] cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed p-8 text-center transition-all",
                dragging
                  ? "border-zinc-950 bg-zinc-950/[0.03] dark:border-white dark:bg-white/[0.06]"
                  : "border-zinc-300 bg-zinc-50/70 hover:bg-zinc-100/70 dark:border-white/12 dark:bg-white/[0.025] dark:hover:bg-white/[0.045]",
              )}
            >
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(event) => handleFile(event.target.files?.[0])}
              />
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[18px] bg-white text-zinc-950 shadow-sm dark:bg-white/[0.08] dark:text-white">
                {isReading ? <Loader2 className="h-6 w-6 animate-spin" /> : <FileUp className="h-6 w-6" />}
              </div>
              <p className="text-sm font-bold text-zinc-900 dark:text-white">
                {isReading ? "Lendo arquivo..." : "Adicionar ou arrastar boleto"}
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Imagem nítida ou PDF com a linha digitável.</p>
            </label>

            <div className="mt-5 space-y-3">
              <Input
                value={formatBoletoValue(input)}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Digite aqui a linha digitável"
                className="h-13 rounded-[18px] border-zinc-200 bg-white/80 px-5 text-sm dark:border-white/10 dark:bg-white/[0.04]"
              />
              <div className="grid gap-3 md:grid-cols-[1fr_180px]">
                <Input
                  value={scheduleDate}
                  onChange={(event) => setScheduleDate(event.target.value)}
                  type="date"
                  className="h-12 rounded-[16px] border-zinc-200 bg-white/80 px-4 dark:border-white/10 dark:bg-white/[0.04]"
                />
                <Button
                  onClick={handleValidate}
                  disabled={!normalized.isValid || simulate.isPending}
                  className="h-12 rounded-[16px] bg-zinc-950 text-[10px] font-black uppercase tracking-[0.16em] text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950"
                >
                  {simulate.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ReceiptText className="mr-2 h-4 w-4" />}
                  Validar
                </Button>
              </div>
            </div>
          </section>

          <aside className="rounded-[28px] border border-zinc-200/70 bg-white/72 p-6 shadow-sm backdrop-blur-3xl dark:border-white/[0.08] dark:bg-white/[0.035]">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-400">Revisão</p>
            {bill ? (
              <div className="mt-5 space-y-5">
                <div className="rounded-[22px] border border-zinc-200/70 bg-zinc-50/80 p-5 dark:border-white/10 dark:bg-black/20">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500" />
                    <div>
                      <p className="font-black text-zinc-950 dark:text-white">{String(bill.beneficiaryName || "Beneficiário confirmado")}</p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{String(bill.bankName || bill.bank || "Banco informado na validação")}</p>
                    </div>
                  </div>
                </div>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-zinc-500">Valor</dt>
                    <dd className="font-black text-zinc-950 dark:text-white">{formatCurrency(Number(bill.value || 0))}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-zinc-500">Vencimento</dt>
                    <dd className="font-bold text-zinc-800 dark:text-zinc-200">{String(bill.dueDate || "Informado na confirmação")}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-zinc-500">Pagamento</dt>
                    <dd className="font-bold text-zinc-800 dark:text-zinc-200">{scheduleDate || "Hoje"}</dd>
                  </div>
                </dl>
                <Button
                  onClick={handlePay}
                  disabled={create.isPending}
                  className="h-13 w-full rounded-[18px] bg-zinc-950 text-[10px] font-black uppercase tracking-[0.18em] text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950"
                >
                  {create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Pagar com saldo
                </Button>
              </div>
            ) : (
              <div className="mt-10 flex min-h-[250px] flex-col items-center justify-center text-center">
                <ReceiptText className="mb-4 h-10 w-10 text-zinc-300 dark:text-zinc-700" />
                <p className="text-sm font-black text-zinc-900 dark:text-white">Valide um boleto para revisar.</p>
                <p className="mt-2 max-w-xs text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                  Só liberamos o pagamento depois de conferir os dados encontrados.
                </p>
              </div>
            )}
          </aside>
        </div>
      )}

      {tab === "boleto" && list.data?.length ? (
        <div className="rounded-[24px] border border-zinc-200/70 bg-white/50 p-5 dark:border-white/10 dark:bg-white/[0.025]">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Últimos boletos</p>
          <div className="space-y-2">
            {list.data.slice(0, 4).map((item) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between rounded-[18px] bg-white/75 px-4 py-3 text-sm dark:bg-white/[0.04]">
                <span className="font-bold text-zinc-900 dark:text-white">{item.beneficiary_name || "Boleto registrado"}</span>
                <span className="text-xs font-black uppercase tracking-wider text-zinc-400">{item.status}</span>
              </motion.div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
