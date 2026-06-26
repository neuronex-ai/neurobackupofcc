import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Lock, X, CreditCard, User, Mail, FileText, Zap, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const SubscriptionSchema = z.object({
  name: z.string().min(3, "Nome completo é obrigatório"),
  email: z.string().email("E-mail inválido"),
  cpfCnpj: z.string().min(11, "CPF/CNPJ inválido"),
});

type SubscriptionFormValues = z.infer<typeof SubscriptionSchema>;

interface SubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: { name: string; price: string; };
}

export const SubscriptionModal = ({ open, onOpenChange, plan }: SubscriptionModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(SubscriptionSchema),
    defaultValues: {
      name: "",
      email: "",
      cpfCnpj: "",
    }
  });

  const onSubmit = async (values: SubscriptionFormValues) => {
    setIsSubmitting(true);
    try {
      localStorage.setItem(
        "neuronex_pending_subscription",
        JSON.stringify({
          planId: plan.name,
          name: values.name,
          email: values.email,
          cpfCnpj: values.cpfCnpj,
          createdAt: new Date().toISOString(),
        }),
      );

      onOpenChange(false);
      toast.info("Crie sua conta para ativar o teste gratis e assinar com seguranca.");
      navigate("/create-account?intent=subscription&plan=professional");
    } catch (error: any) {
      toast.error(error.message || "Nao foi possivel continuar para o cadastro.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950/40 backdrop-blur-[40px] border-white/[0.08] sm:max-w-[480px] p-0 rounded-[56px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9)] max-h-[95vh] overflow-hidden group">
        {/* Premium ambient light effects */}
        <div className="absolute -top-[20%] -left-[20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.03)_0%,transparent_50%)] pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

        {/* Close button - Custom styled for total control */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-6 right-6 z-20 p-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.05] text-white/30 hover:text-white hover:bg-white/[0.08] transition-all hover:scale-105 active:scale-95"
        >
          <X size={16} />
        </button>

        <DialogHeader className="px-10 pt-12 pb-6 flex flex-col items-center sm:items-start text-center sm:text-left space-y-0">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-2">
            <div className="relative">
              <div className="absolute -inset-2 bg-white/10 blur-xl rounded-full opacity-50" />
              <div className="relative w-14 h-14 rounded-[22px] bg-gradient-to-br from-white/[0.12] to-white/[0.02] border border-white/[0.1] flex items-center justify-center shadow-2xl">
                <CreditCard className="w-7 h-7 text-white/80" />
              </div>
            </div>
            <div className="flex flex-col">
              <DialogTitle className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                Assinar <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-white/60">{plan.name}</span>
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="px-10 pb-12 overflow-y-auto max-h-[calc(95vh-200px)] custom-scrollbar">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-7">
              <div className="space-y-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-2.5">
                      <FormLabel className="text-[11px] uppercase tracking-[0.2em] text-white/30 font-black flex items-center gap-2.5 pl-1">
                        <User className="w-3.5 h-3.5" /> Nome Completo
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ex: Dr. Leonardo da Vinci"
                          className="bg-white/[0.03] border-white/[0.08] h-14 rounded-2xl text-[15px] text-white placeholder:text-white/10 focus:border-white/20 focus:ring-0 focus:bg-white/[0.05] transition-all px-5 shadow-inner"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px] text-red-400 font-bold tracking-wide" />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-5">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-2.5">
                        <FormLabel className="text-[11px] uppercase tracking-[0.2em] text-white/30 font-black flex items-center gap-2.5 pl-1">
                          <Mail className="w-3.5 h-3.5" /> E-mail Profissional
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            {...field}
                            placeholder="seu@neuro.com"
                            className="bg-white/[0.03] border-white/[0.08] h-14 rounded-2xl text-[15px] text-white placeholder:text-white/10 focus:border-white/20 focus:ring-0 focus:bg-white/[0.05] transition-all px-5 shadow-inner"
                          />
                        </FormControl>
                        <FormMessage className="text-[10px] text-red-400 font-bold tracking-wide" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cpfCnpj"
                    render={({ field }) => (
                      <FormItem className="space-y-2.5">
                        <FormLabel className="text-[11px] uppercase tracking-[0.2em] text-white/30 font-black flex items-center gap-2.5 pl-1">
                          <FileText className="w-3.5 h-3.5" /> CPF ou CNPJ
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="000.000.000-00"
                            className="bg-white/[0.03] border-white/[0.08] h-14 rounded-2xl text-[15px] text-white placeholder:text-white/10 focus:border-white/20 focus:ring-0 focus:bg-white/[0.05] transition-all px-5 shadow-inner"
                          />
                        </FormControl>
                        <FormMessage className="text-[10px] text-red-400 font-bold tracking-wide" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Plan Summary Card - Refined */}
              <div className="relative overflow-hidden p-6 rounded-[28px] bg-gradient-to-br from-white/[0.04] to-transparent border border-white/[0.08] group-hover:border-white/[0.12] transition-all">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Zap className="w-20 h-20 text-white" />
                </div>

                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
                      <Zap className="w-5 h-5 text-white/80" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-black mb-0.5">Plano Selecionado</span>
                      <span className="text-base font-black text-white">{plan.name}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-2xl font-black text-white tracking-tighter">{plan.price}</span>
                    <span className="text-[10px] text-white/30 font-medium">/mensal</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-16 rounded-2xl bg-white text-black hover:bg-white/90 font-black text-[12px] uppercase tracking-[0.25em] shadow-[0_20px_40px_-10px_rgba(255,255,255,0.15)] transition-all active:scale-[0.98] group/btn"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <span className="flex items-center gap-3">
                      Ir para Pagamento Seguro
                    </span>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-5 text-[10px] text-white/20 font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/50" /> 256-bit SSL
                  </span>
                  <div className="w-1 h-1 rounded-full bg-white/10" />
                  <span className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5" /> Encriptado
                  </span>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
