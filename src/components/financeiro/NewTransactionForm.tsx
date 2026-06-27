"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
// Removed unused z import
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
// Removed unused supabase import
import { useAddTransaction } from "@/hooks/use-add-transaction";
import { usePatients } from "@/hooks/use-patients";
import { cn } from "@/lib/utils";
import { NewTransactionFormValues, NewTransactionSchema } from "@/lib/validation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Calendar as CalendarIcon, Check, CreditCard, FileText, Loader2, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { toast } from "sonner";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";

interface NewTransactionFormProps {
  onSuccess: () => void;
  defaultType?: "income" | "expense";
}

export const NewTransactionForm = ({ onSuccess, defaultType = "income" }: NewTransactionFormProps) => {
  const [step, setStep] = useState(1);
  // Removed unused queryClient variable
  const { data: patients } = usePatients();
  const addTransaction = useAddTransaction();

  const form = useForm<NewTransactionFormValues>({
    resolver: zodResolver(NewTransactionSchema),
    defaultValues: {
      type: defaultType,
      date: new Date(),
      description: "",
      amount: 0,
      category: "",
      payment_method: "pix",
      installments: 1,
    },
  });

  const type = form.watch("type");
  const selectedPatientId = form.watch("patient_id");
  const createPackage = form.watch("create_new_package");

  useEffect(() => {
    form.setValue("type", defaultType);
  }, [defaultType, form]);

  const onSubmit = async (values: NewTransactionFormValues) => {
    try {
      await addTransaction.mutateAsync({
        ...values,
        description: values.description || "",
        amount: values.amount,
        date: values.date,
      } as any);

      toast.success("Movimentação registrada!");
      onSuccess();
    } catch (error: any) {
      console.error("[NewTransactionForm] Falha ao registrar movimentação", error);
      toast.error(getUserFacingErrorMessage(error, "save"));
    }
  };

  const nextStep = async () => {
    const fieldsByStep: Record<number, (keyof NewTransactionFormValues)[]> = {
      1: ["type", "category"],
      2: ["amount", "date", "description", "payment_method"]
    };

    const isValid = await form.trigger(fieldsByStep[step]);
    if (isValid) setStep(prev => prev + 1);
  };

  const inputStyle = "bg-zinc-50 dark:bg-white/[0.03] border-zinc-200 dark:border-white/5 h-14 rounded-2xl transition-all focus:ring-0 text-sm font-bold shadow-sm";
  const labelStyle = "text-[9px] font-black uppercase tracking-[0.35em] text-zinc-400 dark:text-zinc-500 ml-1 mb-3 block";

  return (
    <div className="w-full">
      <div className="flex gap-2 mb-10 justify-center">
        {[1, 2, 3].map(i => (
          <div key={i} className={cn("h-1 rounded-full transition-all duration-700", step >= i ? "w-10 bg-zinc-900 dark:bg-white" : "w-4 bg-zinc-100 dark:bg-white/10")} />
        ))}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
              <div className="space-y-4">
                <label className={labelStyle}>Natureza do Fluxo</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => form.setValue("type", "income")} className={cn("flex flex-col items-center justify-center gap-4 p-8 rounded-[32px] border transition-all duration-500", type === 'income' ? "bg-zinc-900 dark:bg-white border-transparent shadow-2xl scale-[1.02]" : "bg-zinc-50 dark:bg-white/5 border-zinc-100 dark:border-white/5 opacity-40 hover:opacity-100")}>
                    <TrendingUp className={cn("h-6 w-6", type === 'income' ? "text-white dark:text-zinc-900" : "text-emerald-500")} />
                    <span className={cn("text-[10px] font-black uppercase tracking-widest", type === 'income' ? "text-white dark:text-zinc-900" : "text-zinc-500")}>Entrada</span>
                  </button>
                  <button type="button" onClick={() => form.setValue("type", "expense")} className={cn("flex flex-col items-center justify-center gap-4 p-8 rounded-[32px] border transition-all duration-500", type === 'expense' ? "bg-zinc-900 dark:bg-white border-transparent shadow-2xl scale-[1.02]" : "bg-zinc-50 dark:bg-white/5 border-zinc-100 dark:border-white/5 opacity-40 hover:opacity-100")}>
                    <TrendingDown className={cn("h-6 w-6", type === 'expense' ? "text-white dark:text-zinc-900" : "text-rose-500")} />
                    <span className={cn("text-[10px] font-black uppercase tracking-widest", type === 'expense' ? "text-white dark:text-zinc-900" : "text-zinc-500")}>Saída</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className={labelStyle}>Classificação Estratégica</label>
                <Select onValueChange={(v) => form.setValue("category", v)} defaultValue={form.getValues("category")}>
                  <SelectTrigger className={inputStyle}>
                    <SelectValue placeholder="Selecione a categoria..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 rounded-2xl p-2">
                    {type === "income" ? (
                      <>
                        <SelectItem value="sessao" className="rounded-xl font-bold py-3 text-[11px] uppercase tracking-wider">Sessão Atendimento</SelectItem>
                        <SelectItem value="venda" className="rounded-xl font-bold py-3 text-[11px] uppercase tracking-wider">Venda de Produto/Serviço</SelectItem>
                        <SelectItem value="repasses" className="rounded-xl font-bold py-3 text-[11px] uppercase tracking-wider">Repasse Recebido</SelectItem>
                        <SelectItem value="outros" className="rounded-xl font-bold py-3 text-[11px] uppercase tracking-wider">Outras Receitas</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="aluguel" className="rounded-xl font-bold py-3 text-[11px] uppercase tracking-wider">Aluguel / Infraestrutura</SelectItem>
                        <SelectItem value="marketing" className="rounded-xl font-bold py-3 text-[11px] uppercase tracking-wider">Marketing / Publicidade</SelectItem>
                        <SelectItem value="imposto" className="rounded-xl font-bold py-3 text-[11px] uppercase tracking-wider">Impostos / Taxas</SelectItem>
                        <SelectItem value="pro-labore" className="rounded-xl font-bold py-3 text-[11px] uppercase tracking-wider">Pró-Labore / Salários</SelectItem>
                        <SelectItem value="outros" className="rounded-xl font-bold py-3 text-[11px] uppercase tracking-wider">Despesas Diversas</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <Button type="button" onClick={nextStep} className="w-full h-16 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-black uppercase tracking-[0.4em] text-[10px] shadow-2xl transition-all">Prosseguir <ArrowRight className="ml-3 h-4 w-4" /></Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className={labelStyle}><Wallet className="h-3.5 w-3.5 inline mr-2" /> Montante</label>
                  <Input placeholder="0,00" type="number" step="0.01" {...form.register("amount")} className={cn(inputStyle, "text-center tabular-nums text-lg")} />
                </div>
                <div className="space-y-3">
                  <label className={labelStyle}><CalendarIcon className="h-3.5 w-3.5 inline mr-2" /> Data Ciclo</label>
                  <Input
                    type="date"
                    onChange={(e) => form.setValue("date", new Date(e.target.value))}
                    defaultValue={form.getValues("date")?.toISOString().split('T')[0]}
                    className={inputStyle}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className={labelStyle}><CreditCard className="h-3.5 w-3.5 inline mr-2" /> Método de Pagamento</label>
                <Select onValueChange={(v) => form.setValue("payment_method", v as any)} defaultValue={form.getValues("payment_method")}>
                  <SelectTrigger className={inputStyle}>
                    <SelectValue placeholder="Selecione o método..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 rounded-2xl p-2">
                    <SelectItem value="pix" className="rounded-xl font-bold py-3 text-[11px] uppercase tracking-wider">Pix</SelectItem>
                    <SelectItem value="credit_card" className="rounded-xl font-bold py-3 text-[11px] uppercase tracking-wider">Cartão de Crédito</SelectItem>
                    <SelectItem value="debit_card" className="rounded-xl font-bold py-3 text-[11px] uppercase tracking-wider">Cartão de Débito</SelectItem>
                    <SelectItem value="money" className="rounded-xl font-bold py-3 text-[11px] uppercase tracking-wider">Dinheiro / Espécie</SelectItem>
                    <SelectItem value="boleto" className="rounded-xl font-bold py-3 text-[11px] uppercase tracking-wider">Boleto Bancário</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className={labelStyle}><FileText className="h-3.5 w-3.5 inline mr-2" /> Memorial Descritivo</label>
                <Textarea placeholder="Descreva os detalhes desta movimentação..." {...form.register("description")} className="bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/5 rounded-[32px] p-6 min-h-[120px] focus:ring-0 text-sm font-medium shadow-inner resize-none" />
              </div>

              <div className="flex gap-4">
                <Button type="button" variant="ghost" onClick={() => setStep(1)} className="h-16 px-8 rounded-2xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-black uppercase tracking-widest text-[10px]"><ArrowLeft className="h-4 w-4" /></Button>
                <Button type="button" onClick={nextStep} className="flex-1 h-16 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-black uppercase tracking-[0.4em] text-[10px] shadow-2xl transition-all">Próximo Passo <ArrowRight className="ml-3 h-4 w-4" /></Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
              <div className="p-8 rounded-[40px] bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/10 space-y-6">
                <div className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Vínculo Opcional</span>
                </div>
                <div className="space-y-3">
                  <label className={labelStyle}>Paciente Associado</label>
                  <Select onValueChange={(v) => form.setValue("patient_id", v)}>
                    <SelectTrigger className={inputStyle}>
                      <SelectValue placeholder="Sem vínculo..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 rounded-2xl p-2 max-h-[300px]">
                      {patients?.map(p => (
                        <SelectItem key={p.id} value={p.id} className="rounded-xl font-bold py-3">{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedPatientId && type === "income" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-4 pt-4 border-t border-zinc-100 dark:border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Transformar em Pacote?</span>
                      <button
                        type="button"
                        onClick={() => form.setValue("create_new_package", !createPackage)}
                        className={cn("w-12 h-6 rounded-full transition-all duration-500 relative", createPackage ? "bg-emerald-500 shadow-[0_0_15px_-3px_rgba(16,185,129,0.5)]" : "bg-zinc-200 dark:bg-white/10")}
                      >
                        <div className={cn("absolute top-1 left-1 w-4 h-4 rounded-full transition-transform duration-500 shadow-sm", createPackage ? "translate-x-6 bg-white" : "bg-white dark:bg-zinc-400")} />
                      </button>
                    </div>
                    {createPackage && (
                      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-3 pt-2">
                        <label className={labelStyle}>Número de Sessões</label>
                        <Input type="number" placeholder="Ex: 10" {...form.register("new_package_sessions")} className={inputStyle} />
                        <p className="text-[9px] text-zinc-400 dark:text-zinc-500 italic ml-1">Uma sessão será debitada automaticamente após a criação.</p>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </div>

              <div className="flex gap-4">
                <Button type="button" variant="ghost" onClick={() => setStep(2)} className="h-16 px-8 rounded-2xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-black uppercase tracking-widest text-[10px]"><ArrowLeft className="h-4 w-4" /></Button>
                <Button type="submit" disabled={addTransaction.isPending} className="flex-1 h-16 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-black uppercase tracking-[0.4em] text-[10px] shadow-2xl transition-all active:scale-95 disabled:opacity-50">
                  {addTransaction.isPending ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : "Finalizar Registro"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
};
