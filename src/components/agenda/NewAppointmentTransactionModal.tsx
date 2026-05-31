"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { DollarSign, Loader2, TrendingUp, TrendingDown, Wallet, X, Calendar, Tag } from "lucide-react";
import { Appointment } from "@/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAddAppointmentTransaction } from "@/hooks/use-add-appointment-transaction";


const AppointmentTransactionSchema = z.object({
  description: z.string().min(3, { message: "A descrição deve ter pelo menos 3 caracteres." }),
  amount: z.coerce.number().positive({ message: "O valor deve ser positivo." }),
  type: z.enum(["income", "expense"], { required_error: "O tipo é obrigatório." }),
  category: z.string().optional().or(z.literal("")),
});

type AppointmentTransactionFormValues = z.infer<typeof AppointmentTransactionSchema>;

interface NewAppointmentTransactionModalProps {
  appointment: Appointment;
  patientName: string;
  children: React.ReactNode;
  defaultAmount?: number;
  defaultDescription?: string;
  defaultCategory?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const NewAppointmentTransactionModal = ({
  appointment,
  patientName,
  children,
  defaultAmount,
  defaultDescription,
  defaultCategory,
  isOpen: controlledOpen,
  onOpenChange: setControlledOpen
}: NewAppointmentTransactionModalProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = setControlledOpen !== undefined ? setControlledOpen : setInternalOpen;

  const { mutate, isPending } = useAddAppointmentTransaction();

  const form = useForm<AppointmentTransactionFormValues>({
    resolver: zodResolver(AppointmentTransactionSchema),
    defaultValues: {
      description: defaultDescription || `Sessão - ${patientName}`,
      amount: defaultAmount || 0,
      type: "income",
      category: defaultCategory || "Terapia",
    },
  });

  // Atualiza valores se os defaults mudarem (ex: vindo da auditoria)
  useEffect(() => {
    if (open) {
      form.reset({
        description: defaultDescription || `Sessão - ${patientName}`,
        amount: defaultAmount || 0,
        type: "income",
        category: defaultCategory || "Terapia",
      });
    }
  }, [open, defaultAmount, defaultDescription, defaultCategory, patientName, form]);

  const transactionType = form.watch("type");

  const onSubmit = (values: AppointmentTransactionFormValues) => {
    mutate({
      appointmentId: appointment.id,
      description: values.description,
      amount: values.amount,
      type: values.type,
      category: values.category || 'N/A',
      date: new Date(appointment.start_time),
    }, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-[40px] border border-border/10 p-0 rounded-[32px] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] outline-none [&>button]:hidden z-[9000]">
        <DialogHeader className="p-8 pb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/20">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <DialogTitle className="text-lg font-bold tracking-tight">Registrar Transação</DialogTitle>
            </div>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-accent">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
          <DialogDescription className="text-xs font-medium text-muted-foreground ml-1">
            Vincule este lançamento financeiro à sessão do paciente.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 pt-4 space-y-8">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-2 gap-4"
                    >
                      <FormItem>
                        <RadioGroupItem value="income" id="income" className="peer sr-only" />
                        <FormLabel htmlFor="income" className="flex flex-col items-center justify-center rounded-[24px] border-2 border-border/10 bg-card/40 p-6 hover:bg-accent/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground cursor-pointer transition-all duration-300 group shadow-lg">
                          <TrendingUp className="mb-2 h-6 w-6 group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Receita</span>
                        </FormLabel>
                      </FormItem>
                      <FormItem>
                        <RadioGroupItem value="expense" id="expense" className="peer sr-only" />
                        <FormLabel htmlFor="expense" className="flex flex-col items-center justify-center rounded-[24px] border-2 border-border/10 bg-card/40 p-6 hover:bg-accent/50 peer-data-[state=checked]:border-destructive peer-data-[state=checked]:bg-destructive peer-data-[state=checked]:text-destructive-foreground cursor-pointer transition-all duration-300 group shadow-lg">
                          <TrendingDown className="mb-2 h-6 w-6 group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Despesa</span>
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-6">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground ml-1">Descrição</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                        <Input placeholder="Ex: Pagamento da sessão" {...field} className="h-12 bg-card/30 border-border/50 rounded-xl pl-11 focus:ring-0 focus:border-primary/30 transition-all" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground ml-1">Valor (R$)</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                          <Input type="number" step="0.01" placeholder="0.00" {...field} className="h-12 bg-card/30 border-border/50 rounded-xl pl-11 font-bold focus:ring-0 focus:border-primary/30 transition-all" />
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
                      <FormLabel className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground ml-1">Categoria</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Terapia" {...field} className="h-12 bg-card/30 border-border/50 rounded-xl focus:ring-0 focus:border-primary/30 transition-all" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 bg-secondary/30 p-3 rounded-2xl border border-border/30">
              <Calendar className="h-4 w-4 text-muted-foreground/50" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Registro em {new Date(appointment.start_time).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-16 rounded-[20px] bg-primary text-primary-foreground hover:bg-primary/90 font-black uppercase text-[11px] tracking-[0.4em] shadow-lg shadow-primary/20 transition-all duration-500 hover:scale-[1.01] active:scale-95 disabled:opacity-50"
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-3 h-4 w-4 animate-spin" />}
              {isPending ? "Processando..." : transactionType === 'income' ? "Confirmar Recebimento" : "Registrar Despesa"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};