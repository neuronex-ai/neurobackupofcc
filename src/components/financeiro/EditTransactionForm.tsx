import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateTransaction } from "@/hooks/use-update-transaction";
import { cn } from "@/lib/utils";
import { NewTransactionFormValues, NewTransactionSchema } from "@/lib/validation";
import { Transaction } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Banknote, Barcode, Calendar as CalendarIcon, CreditCard, DollarSign, Loader2, QrCode, Save, TrendingDown, TrendingUp } from "lucide-react";
import { useForm } from "react-hook-form";

interface EditTransactionFormProps {
  transaction: Transaction;
  onSuccess: () => void;
}

export const EditTransactionForm = ({ transaction, onSuccess }: EditTransactionFormProps) => {
  const { mutate, isPending } = useUpdateTransaction();

  const form = useForm<NewTransactionFormValues>({
    resolver: zodResolver(NewTransactionSchema),
    defaultValues: {
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category || "",
      date: new Date(transaction.date + 'T00:00:00'),
      payment_method: (transaction.payment_method || 'pix') as any,
      installments: transaction.installments || 1,
      external_reference: transaction.external_reference || ""
    },
  });

  const paymentMethod = form.watch("payment_method");

  const onSubmit = (values: NewTransactionFormValues) => {
    const updates = {
      description: values.description,
      amount: values.amount,
      type: values.type,
      category: values.category || null,
      date: values.date.toISOString().split('T')[0],
      payment_method: values.payment_method,
      installments: values.installments,
      external_reference: values.external_reference
    };

    mutate({ id: transaction.id, updates }, {
      onSuccess: () => {
        onSuccess();
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider font-semibold ml-1">Tipo</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-2 gap-3"
                >
                  <FormItem className="space-y-0">
                    <FormControl>
                      <div>
                        <RadioGroupItem value="income" id="income" className="peer sr-only" />
                        <label
                          htmlFor="income"
                          className={cn(
                            "cursor-pointer flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-300",
                            field.value === "income"
                              ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_20px_-5px_rgba(16,185,129,0.2)]"
                              : "bg-white/[0.02] border-white/10 text-muted-foreground hover:bg-white/[0.05]"
                          )}
                        >
                          <TrendingUp className="h-5 w-5" />
                          <span className="text-xs font-bold uppercase tracking-wider">Receita</span>
                        </label>
                      </div>
                    </FormControl>
                  </FormItem>

                  <FormItem className="space-y-0">
                    <FormControl>
                      <div>
                        <RadioGroupItem value="expense" id="expense" className="peer sr-only" />
                        <label
                          htmlFor="expense"
                          className={cn(
                            "cursor-pointer flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-300",
                            field.value === "expense"
                              ? "bg-rose-500/10 border-rose-500/50 text-rose-400 shadow-[0_0_20px_-5px_rgba(244,63,94,0.2)]"
                              : "bg-white/[0.02] border-white/10 text-muted-foreground hover:bg-white/[0.05]"
                          )}
                        >
                          <TrendingDown className="h-5 w-5" />
                          <span className="text-xs font-bold uppercase tracking-wider">Despesa</span>
                        </label>
                      </div>
                    </FormControl>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider font-semibold ml-1">Descrição</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Sessão - João Silva" {...field} className="bg-black/20 border-white/10 focus:bg-black/40 h-11 rounded-xl" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider font-semibold ml-1">
                  Valor (R$)

                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="number" placeholder="0.00" {...field} className="pl-9 bg-black/20 border-white/10 focus:bg-black/40 h-11 rounded-xl font-mono" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider font-semibold ml-1">Categoria</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Terapia" {...field} className="bg-black/20 border-white/10 focus:bg-black/40 h-11 rounded-xl" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-3 p-4 rounded-xl bg-white/[0.03] border border-white/5">
          <FormField
            control={form.control}
            name="payment_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Método</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="grid grid-cols-3 gap-2"
                  >
                    {[{ id: 'pix', icon: QrCode, l: 'Pix' }, { id: 'money', icon: Banknote, l: 'Dinheiro' }, { id: 'credit_card', icon: CreditCard, l: 'Cartão' }, { id: 'boleto', icon: Barcode, l: 'Boleto' }].map((m) => (
                      <FormItem key={m.id}>
                        <FormControl>
                          <RadioGroupItem value={m.id} id={m.id} className="peer sr-only" />
                        </FormControl>
                        <label htmlFor={m.id} className="flex flex-col items-center justify-center p-2 rounded-lg border border-white/5 bg-black/20 hover:bg-white/5 peer-aria-checked:bg-primary/20 peer-aria-checked:border-primary/50 peer-aria-checked:text-primary transition-all cursor-pointer text-muted-foreground">
                          <m.icon className="h-4 w-4 mb-1" />
                          <span className="text-[9px] font-bold uppercase">{m.l}</span>
                        </label>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}
          />

          {/* Installments for Credit Card */}
          {paymentMethod === 'credit_card' && (
            <FormField
              control={form.control}
              name="installments"
              render={({ field }) => (
                <FormItem className="animate-fade-in">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Parcelas</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                      <FormControl>
                        <SelectTrigger className="w-24 h-8 text-xs bg-black/40 border-white/10 rounded-lg"><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-[#1A1A1D] border-white/10">
                        {[1, 2, 3, 4, 5, 6, 10, 12].map(i => <SelectItem key={i} value={String(i)}>{i}x</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </FormItem>
              )}
            />
          )}
        </div>

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider font-semibold ml-1 mb-1.5">Data</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal bg-black/20 border-white/10 hover:bg-black/30 h-11 rounded-xl",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? format(field.value, "dd/MM/yyyy", { locale: ptBR }) : <span>Escolha uma data</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-white/10 bg-[#0A0A0B]" align="start">
                  <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={ptBR} />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full gap-2 h-12 rounded-xl shadow-glow" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="h-4 w-4" />
          {isPending ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </form>
    </Form>
  );
};