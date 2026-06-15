import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ArrowDownRight, ArrowUpRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { useAddTransaction } from "@/hooks/use-add-transaction";
import { usePatients } from "@/hooks/use-patients";
import { cn } from "@/lib/utils";
import { parseMoney } from "../../shared/MobileFinancePrimitives";

type EntryType = "income" | "expense";

export function MobileFinancialEntrySheet({
  open,
  onOpenChange,
  defaultType = "income",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: EntryType;
}) {
  const addTransaction = useAddTransaction();
  const { data: patients = [] } = usePatients();
  const [type, setType] = useState<EntryType>(defaultType);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [patientId, setPatientId] = useState("");

  useEffect(() => {
    if (open) setType(defaultType);
  }, [defaultType, open]);

  const numericAmount = useMemo(() => parseMoney(amount), [amount]);
  const valid = description.trim().length >= 2 && numericAmount > 0 && Boolean(date);

  const closeAndReset = () => {
    onOpenChange(false);
    setDescription("");
    setAmount("");
    setCategory("");
    setPatientId("");
  };

  const submit = async () => {
    if (!valid) return;
    try {
      await addTransaction.mutateAsync({
        description: description.trim(),
        amount: numericAmount,
        type,
        category: category.trim() || undefined,
        date: new Date(`${date}T12:00:00`),
        payment_method: paymentMethod,
        patient_id: patientId || undefined,
        debit_session: false,
      });
      toast.success(type === "income" ? "Entrada registrada." : "Despesa registrada.");
      closeAndReset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh] overflow-y-auto border-border/40 bg-background px-5 pb-[calc(28px+env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto h-1 w-10 rounded-full bg-foreground/15" />
        <div className="mt-7">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Gestão Financeira
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">
            Novo lançamento
          </h2>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Registre um movimento administrativo. Esta ação não movimenta saldo da conta NeuroFinance.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-[20px] border border-border/40 bg-card/60 p-1.5">
          {[
            { value: "income" as const, label: "Entrada", icon: ArrowUpRight },
            { value: "expense" as const, label: "Despesa", icon: ArrowDownRight },
          ].map((item) => {
            const Icon = item.icon;
            const active = type === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setType(item.value)}
                className={cn(
                  "flex h-12 items-center justify-center gap-2 rounded-[16px] text-xs font-semibold transition",
                  active
                    ? "bg-foreground text-background"
                    : "text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.7} />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Descrição
            </span>
            <Input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Ex.: sessão, aluguel, material"
              className="mt-2 h-[52px] rounded-[18px] border-border/50 bg-card"
            />
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

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Data
              </span>
              <Input
                value={date}
                onChange={(event) => setDate(event.target.value)}
                type="date"
                className="mt-2 h-[52px] rounded-[18px] border-border/50 bg-card"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Categoria
              </span>
              <Input
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="Opcional"
                className="mt-2 h-[52px] rounded-[18px] border-border/50 bg-card"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Forma de pagamento
            </span>
            <select
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
              className="mt-2 h-[52px] w-full rounded-[18px] border border-border/50 bg-card px-4 text-sm outline-none"
            >
              <option value="pix">Pix</option>
              <option value="cash">Dinheiro</option>
              <option value="card">Cartão</option>
              <option value="external_transfer">Transferência externa</option>
              <option value="boleto">Boleto</option>
              <option value="manual">Outro</option>
            </select>
          </label>

          <label className="block">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Paciente relacionado
            </span>
            <select
              value={patientId}
              onChange={(event) => setPatientId(event.target.value)}
              className="mt-2 h-[52px] w-full rounded-[18px] border border-border/50 bg-card px-4 text-sm outline-none"
            >
              <option value="">Nenhum paciente</option>
              {patients.map((patient: any) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <Button
          type="button"
          disabled={!valid || addTransaction.isPending}
          onClick={() => void submit()}
          className="mt-6 h-14 w-full rounded-[20px] text-xs font-semibold uppercase tracking-[0.16em]"
        >
          {addTransaction.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Salvar lançamento
        </Button>
      </DrawerContent>
    </Drawer>
  );
}
