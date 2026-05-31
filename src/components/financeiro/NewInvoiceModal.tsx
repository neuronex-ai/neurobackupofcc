"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  QrCode, Loader2, Check, Copy, Share2, User as UserIcon, X,
  CreditCard, ArrowRight, AlertCircle, Barcode
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { usePatients } from "@/hooks/use-patients";
import { useGenerateInvoice } from "@/hooks/use-generate-invoice";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { useFinancialAccount } from "@/hooks/use-financial-account";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";

const NewInvoiceSchema = z.object({
  patientId: z.string().min(1, { message: "Selecione um paciente." }),
  amount: z.coerce.number().positive({ message: "O valor deve ser maior que zero." }),
  description: z.string().min(3, { message: "Descrição curta obrigatória." }),
  paymentMethods: z.array(z.string()).min(1, "Selecione pelo menos um método."),
});

type NewInvoiceFormValues = z.infer<typeof NewInvoiceSchema>;

const QUICK_AMOUNTS = [150, 200, 250, 300];

export const NewInvoiceModal = React.memo(({ children }: { children?: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [boletoUrl, setBoletoUrl] = useState<string | null>(null);
  const [pixData, setPixData] = useState<{ qrCode?: string; copyPaste?: string } | undefined>();
  const [expiresAt, setExpiresAt] = useState<string | undefined>();

  const { data: patients } = usePatients();
  const { mutate: generateInvoice, isPending: isCreating } = useGenerateInvoice();
  const { isConnected: isAccountReady } = useFinancialAccount();

  const form = useForm<NewInvoiceFormValues>({
    resolver: zodResolver(NewInvoiceSchema),
    defaultValues: {
      description: "Sessão de Psicoterapia",
      amount: undefined as unknown as number,
      paymentMethods: ["pix", "card"],
    },
    mode: "onChange"
  });

  const watchedAmount = form.watch("amount");

  const onSubmit = useCallback((values: NewInvoiceFormValues) => {
    if (!isAccountReady) {
      toast.error("Atenção: Sua conta NeuroFinance precisa ser conectada para gerar cobranças reais.");
      return;
    }

    /**
     * Para o Supabase:
     * salvamos exatamente o array selecionado no frontend
     * Ex:
     * ["pix"]
     * ["card"]
     * ["pix", "card"]
     */
    const paymentMethodType = values.paymentMethods;

    /**
     * Para o Asaas:
     * se houver mais de um método, usamos UNDEFINED
     * se houver apenas um, convertemos para o formato esperado pela API
     */
    let billingType = "UNDEFINED";

    if (values.paymentMethods.length === 1) {
      const selectedMethod = values.paymentMethods[0];

      const billingTypeMap: Record<string, string> = {
        pix: "PIX",
        card: "CREDIT_CARD",
        boleto: "BOLETO",
      };

      billingType = billingTypeMap[selectedMethod] || "UNDEFINED";
    }

    generateInvoice(
      {
        patientId: values.patientId,
        amount: values.amount,
        description: values.description,
        dueDate: new Date(),

        // Asaas
        billingType,

        // Supabase
        paymentMethodType,
      },
      {
        onSuccess: (data: any) => {
          setPaymentUrl(data.paymentUrl || null);
          setBoletoUrl(data.boletoUrl || null);

          setPixData(
            data.pixQrCode
              ? {
                qrCode: data.pixQrCode,
                copyPaste: data.pixCopyPaste,
              }
              : undefined
          );

          setExpiresAt(data.expiresAt);
          setStep("success");
        },
        onError: (err: any) => {
          console.error("Erro ao gerar fatura:", err);
          toast.error("Erro ao gerar cobrança.", {
            description: err.message,
          });
        },
      }
    );
  }, [isAccountReady, generateInvoice]);

  const handleCopy = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  }, []);

  const handleShare = useCallback(() => {
    const values = form.getValues();
    const patient = patients?.find((p: any) => p.id === values.patientId);
    if (!patient?.phone || !paymentUrl) {
      toast.error("Dados incompletos para compartilhamento.");
      return;
    }
    const phone = patient.phone.replace(/\D/g, '');
    const amountStr = Number(values.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const msg = `Olá ${patient.name.split(' ')[0]}! Segue o link para o pagamento da sua sessão (${amountStr}):\n${paymentUrl}`;
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  }, [patients, paymentUrl, form]);

  const reset = useCallback(() => {
    setStep('form');
    form.reset();
    setPaymentUrl(null);
    setBoletoUrl(null);
    setPixData(undefined);
    setExpiresAt(undefined);
  }, [form]);

  const handleOpenChange = useCallback((val: boolean) => {
    setOpen(val);
    if (!val) setTimeout(reset, 300);
  }, [reset]);

  const renderSuccess = () => (
    <div className="flex flex-col h-full max-h-[inherit]">
      <div className="px-8 pt-8 pb-6 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">Cobrança Gerada</h2>
          <p className="text-xs text-zinc-500 font-medium mt-1">Pronta para enviar ao paciente.</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleOpenChange(false)}
          className="rounded-full w-10 h-10 hover:bg-zinc-100 dark:hover:bg-white/5"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="px-8 py-8 overflow-y-auto flex-1 custom-scrollbar space-y-8 bg-zinc-50/30 dark:bg-transparent">
        <div className="text-center">
          <div className="w-20 h-20 rounded-[24px] bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 shadow-xl">
            <Check className="h-10 w-10 text-emerald-500" strokeWidth={2.5} />
          </div>
          <p className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter">
            {Number(form.getValues("amount") || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          {expiresAt && (
            <p className="text-[10px] text-zinc-400 mt-3 uppercase tracking-widest font-black opacity-60">
              Vencimento em {new Date(expiresAt).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>

        {pixData?.qrCode && (
          <div className="rounded-[32px] border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-8 flex flex-col items-center gap-6 shadow-sm">
            <div className="flex items-center gap-2 self-start">
              <QrCode className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">QR Code Pix — Asaas</span>
            </div>
            <div className="bg-white p-5 rounded-3xl shadow-2xl border border-zinc-100">
              <img
                src={pixData.qrCode.startsWith('data:') ? pixData.qrCode : `data:image/png;base64,${pixData.qrCode}`}
                alt="PIX QR Code"
                className="w-48 h-48 object-contain"
              />
            </div>
            {pixData.copyPaste && (
              <button
                onClick={() => handleCopy(pixData.copyPaste!, "Código Pix")}
                className="w-full flex items-center gap-4 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-2xl px-6 py-5 transition-all active:scale-[0.98]"
              >
                <div className="flex-1 text-left overflow-hidden">
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">Copia e Cola</p>
                  <code className="text-[11px] text-zinc-900 dark:text-zinc-100 font-mono truncate block">{pixData.copyPaste}</code>
                </div>
                <Copy className="h-4 w-4 text-zinc-400" />
              </button>
            )}
          </div>
        )}

        {(paymentUrl || boletoUrl) && (
          <div className="rounded-[32px] border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-6 space-y-5 shadow-sm">
            {paymentUrl && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-500" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Link de Pagamento</span>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 bg-zinc-100 dark:bg-white/5 rounded-2xl px-5 h-14 flex items-center overflow-hidden border border-transparent">
                    <span className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate font-mono">{paymentUrl}</span>
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleCopy(paymentUrl, "Link")}
                    className="h-14 w-14 shrink-0 rounded-2xl border-zinc-200 dark:border-white/10"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {boletoUrl && (
              <div className="pt-5 border-t border-zinc-100 dark:border-white/5">
                <Button
                  variant="outline"
                  onClick={() => window.open(boletoUrl, '_blank')}
                  className="w-full h-14 rounded-2xl bg-zinc-100 dark:bg-white/5 border-zinc-200 dark:border-white/10 hover:bg-zinc-200 flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest"
                >
                  <Barcode className="h-4 w-4" /> Visualizar Boleto (PDF)
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-8 bg-white dark:bg-black/20 border-t border-zinc-100 dark:border-white/5 flex gap-4 shrink-0">
        <Button
          onClick={handleShare}
          className="flex-1 h-16 rounded-[20px] bg-zinc-900 dark:bg-white text-white dark:text-black font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:opacity-90 transition-all active:scale-95 gap-3"
        >
          <Share2 className="h-4 w-4" /> Enviar no WhatsApp
        </Button>
        <Button
          variant="ghost"
          onClick={() => handleOpenChange(false)}
          className="h-16 px-8 rounded-[20px] text-[10px] font-black uppercase tracking-widest text-zinc-500"
        >
          Fechar
        </Button>
      </div>
    </div>
  );

  const renderForm = () => (
    <div className="flex flex-col h-full max-h-[inherit]">
      <div className="px-8 pt-8 pb-6 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">Nova Cobrança</h2>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-1.5 rounded-full bg-zinc-900 dark:bg-white w-10" />
            <div className="h-1.5 rounded-full bg-zinc-200 dark:bg-white/10 w-6" />
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleOpenChange(false)}
          className="rounded-full w-10 h-10 hover:bg-zinc-100 dark:hover:bg-white/5"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="px-8 py-8 overflow-y-auto flex-1 custom-scrollbar bg-zinc-50/30 dark:bg-transparent">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
            {!isAccountReady && (
              <div className="p-5 rounded-3xl border border-amber-500/20 bg-amber-500/5 flex items-center gap-4">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-600 dark:text-amber-400 font-bold leading-relaxed">
                  Conta NeuroFinance pendente. Ative em Configurações para emitir cobranças reais.
                </p>
              </div>
            )}

            <div className="space-y-6">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Valor da Sessão (R$)</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <span className="absolute left-7 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-zinc-600 text-xl font-black">R$</span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                          className="h-20 bg-white dark:bg-white/5 border-zinc-200 dark:border-white/10 rounded-[28px] pl-16 text-4xl font-black text-zinc-900 dark:text-white transition-all focus:ring-0 focus:border-zinc-400 dark:focus:border-white/20 shadow-sm"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-[10px] font-bold text-red-500" />
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-2 flex-wrap px-1">
                {QUICK_AMOUNTS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => form.setValue("amount", val, { shouldValidate: true })}
                    className={cn(
                      "px-6 py-3 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all active:scale-95",
                      Number(watchedAmount) === val
                        ? "bg-zinc-900 dark:bg-white text-white dark:text-black border-transparent shadow-xl"
                        : "bg-white dark:bg-white/5 border-zinc-100 dark:border-white/10 text-zinc-400 hover:border-zinc-300 dark:hover:border-white/20"
                    )}
                  >
                    R$ {val}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <FormField
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Paciente</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-16 bg-white dark:bg-white/5 border-zinc-200 dark:border-white/10 rounded-[24px] focus:ring-0 text-sm font-bold px-7 shadow-sm text-zinc-900 dark:text-white">
                          <div className="flex items-center gap-3">
                            <UserIcon className="h-4 w-4 text-zinc-400" />
                            <SelectValue placeholder="Selecione o paciente..." />
                          </div>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl border-zinc-100 dark:border-white/10 shadow-2xl bg-white dark:bg-zinc-950">
                        {patients?.map(p => (
                          <SelectItem key={p.id} value={p.asaas_customer_id || p.id} className="py-4 px-5 text-sm font-bold cursor-pointer text-zinc-900 dark:text-zinc-100 focus:bg-zinc-50 dark:focus:bg-white/5">
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Descrição</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ex: Sessão de Psicoterapia"
                        className="h-16 bg-white dark:bg-white/5 border-zinc-200 dark:border-white/10 rounded-[24px] px-7 text-sm font-bold placeholder:text-zinc-300 text-zinc-900 dark:text-white"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethods"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Métodos de Pagamento</FormLabel>
                    <ToggleGroup
                      type="multiple"
                      value={field.value}
                      onValueChange={(val) => field.onChange(val.length > 0 ? val : field.value)}
                      className="grid grid-cols-3 gap-4"
                    >
                      <ToggleGroupItem
                        value="pix"
                        className="h-28 rounded-[28px] border-2 border-zinc-100 dark:border-white/5 bg-white dark:bg-white/5 data-[state=on]:border-zinc-900 dark:data-[state=on]:border-white data-[state=on]:text-zinc-900 dark:data-[state=on]:text-white text-zinc-400 flex flex-col gap-3 transition-all"
                      >
                        <QrCode className="h-6 w-6" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Pix</span>
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="card"
                        className="h-28 rounded-[28px] border-2 border-zinc-100 dark:border-white/5 bg-white dark:bg-white/5 data-[state=on]:border-zinc-900 dark:data-[state=on]:border-white data-[state=on]:text-zinc-900 dark:data-[state=on]:text-white text-zinc-400 flex flex-col gap-3 transition-all"
                      >
                        <CreditCard className="h-6 w-6" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Cartão</span>
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="boleto"
                        className="h-28 rounded-[28px] border-2 border-zinc-100 dark:border-white/5 bg-white dark:bg-white/5 data-[state=on]:border-zinc-900 dark:data-[state=on]:border-white data-[state=on]:text-zinc-900 dark:data-[state=on]:text-white text-zinc-400 flex flex-col gap-3 transition-all"
                      >
                        <Barcode className="h-6 w-6" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Boleto</span>
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </div>

      <div className="p-8 bg-white dark:bg-black/20 border-t border-zinc-100 dark:border-white/5 flex justify-between items-center shrink-0">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total a cobrar</span>
          <span className="text-xl font-black text-zinc-900 dark:text-white">
            {watchedAmount ? Number(watchedAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}
          </span>
        </div>
        <Button
          type="button"
          onClick={form.handleSubmit(onSubmit)}
          disabled={isCreating}
          className="h-16 px-12 rounded-[20px] bg-zinc-900 dark:bg-white text-white dark:text-black font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:opacity-90 transition-all active:scale-95 gap-3"
        >
          {isCreating ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Gerar Cobrança <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </div>
    </div>
  );

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={handleOpenChange}
      trigger={children || <Button className="bg-zinc-900 dark:bg-white text-white dark:text-black rounded-full font-black uppercase text-[10px] tracking-widest h-12 px-8">Gerar Cobrança</Button>}
      className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-[40px] p-0 overflow-hidden sm:max-w-[650px] h-[90vh] flex flex-col shadow-2xl"
    >
      <div className="flex flex-col h-full overflow-hidden">
        {step === 'success' ? renderSuccess() : renderForm()}
      </div>
    </ResponsiveModal>
  );
});

NewInvoiceModal.displayName = "NewInvoiceModal";