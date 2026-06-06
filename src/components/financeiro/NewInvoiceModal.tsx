"use client";

import React, { useCallback, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  ArrowRight,
  Barcode,
  Check,
  Copy,
  CreditCard,
  Loader2,
  QrCode,
  Share2,
  User as UserIcon,
  X,
} from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useGenerateInvoice } from "@/hooks/use-generate-invoice";
import { usePatients } from "@/hooks/use-patients";
import { useFinancialAccount } from "@/hooks/use-financial-account";
import { cn } from "@/lib/utils";

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
  const [step, setStep] = useState<"form" | "success">("form");
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
    mode: "onChange",
  });

  const watchedAmount = form.watch("amount");

  const reset = useCallback(() => {
    setStep("form");
    form.reset();
    setPaymentUrl(null);
    setBoletoUrl(null);
    setPixData(undefined);
    setExpiresAt(undefined);
  }, [form]);

  const handleOpenChange = useCallback((value: boolean) => {
    setOpen(value);
    if (!value) setTimeout(reset, 300);
  }, [reset]);

  const onSubmit = useCallback((values: NewInvoiceFormValues) => {
    if (!isAccountReady) {
      toast.error("Atenção: sua conta NeuroFinance precisa estar conectada para gerar cobranças reais.");
      return;
    }

    const paymentMethodType = values.paymentMethods;
    let billingType = "UNDEFINED";

    if (values.paymentMethods.length === 1) {
      const billingTypeMap: Record<string, string> = {
        pix: "PIX",
        card: "CREDIT_CARD",
        boleto: "BOLETO",
      };
      billingType = billingTypeMap[values.paymentMethods[0]] || "UNDEFINED";
    }

    generateInvoice(
      {
        patientId: values.patientId,
        amount: values.amount,
        description: values.description,
        dueDate: new Date(),
        billingType,
        paymentMethodType,
      },
      {
        onSuccess: (data: any) => {
          setPaymentUrl(data.paymentUrl || null);
          setBoletoUrl(data.boletoUrl || null);
          setPixData(data.pixQrCode ? { qrCode: data.pixQrCode, copyPaste: data.pixCopyPaste } : undefined);
          setExpiresAt(data.expiresAt);
          setStep("success");
        },
        onError: (err: any) => {
          console.error("Erro ao gerar fatura:", err);
          toast.error("Erro ao gerar cobrança.", { description: err.message });
        },
      }
    );
  }, [isAccountReady, generateInvoice]);

  const handleCopy = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado.`);
  }, []);

  const handleShare = useCallback(() => {
    const values = form.getValues();
    const patient = patients?.find((p: any) => p.id === values.patientId);

    if (!patient?.phone || !paymentUrl) {
      toast.error("Dados incompletos para compartilhamento.");
      return;
    }

    const phone = patient.phone.replace(/\D/g, "");
    const amountStr = Number(values.amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const msg = `Olá ${patient.name.split(" ")[0]}! Segue o link para o pagamento da sua sessão (${amountStr}):\n${paymentUrl}`;
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  }, [patients, paymentUrl, form]);

  const renderSuccess = () => (
    <div className="flex h-full max-h-[inherit] flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-8 pb-6 pt-8 dark:border-white/5">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">Cobrança gerada</h2>
          <p className="mt-1 text-xs font-medium text-zinc-500">Pronta para enviar ao paciente.</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => handleOpenChange(false)} className="h-10 w-10 rounded-full hover:bg-zinc-100 dark:hover:bg-white/5">
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="custom-scrollbar flex-1 space-y-8 overflow-y-auto bg-zinc-50/30 px-8 py-8 dark:bg-transparent">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[24px] border border-emerald-500/20 bg-emerald-500/10 shadow-xl">
            <Check className="h-10 w-10 text-emerald-500" strokeWidth={2.5} />
          </div>
          <p className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-white">
            {Number(form.getValues("amount") || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
          {expiresAt && (
            <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 opacity-60">
              Vencimento em {new Date(expiresAt).toLocaleDateString("pt-BR")}
            </p>
          )}
        </div>

        {pixData?.qrCode && (
          <div className="flex flex-col items-center gap-6 rounded-[32px] border border-zinc-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
            <div className="flex items-center gap-2 self-start">
              <QrCode className="h-4 w-4 text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">QR Code Pix - Asaas</span>
            </div>
            <div className="rounded-3xl border border-zinc-100 bg-white p-5 shadow-2xl">
              <img
                src={pixData.qrCode.startsWith("data:") ? pixData.qrCode : `data:image/png;base64,${pixData.qrCode}`}
                alt="PIX QR Code"
                className="h-48 w-48 object-contain"
              />
            </div>
            {pixData.copyPaste && (
              <button
                onClick={() => handleCopy(pixData.copyPaste!, "Código Pix")}
                className="flex w-full items-center gap-4 rounded-2xl bg-zinc-100 px-6 py-5 transition-all hover:bg-zinc-200 active:scale-[0.98] dark:bg-white/5 dark:hover:bg-white/10"
              >
                <div className="flex-1 overflow-hidden text-left">
                  <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-zinc-400">Copia e cola</p>
                  <code className="block truncate font-mono text-[11px] text-zinc-900 dark:text-zinc-100">{pixData.copyPaste}</code>
                </div>
                <Copy className="h-4 w-4 text-zinc-400" />
              </button>
            )}
          </div>
        )}

        {(paymentUrl || boletoUrl) && (
          <div className="space-y-5 rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
            {paymentUrl && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-blue-500" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Link de pagamento</span>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-14 flex-1 items-center overflow-hidden rounded-2xl bg-zinc-100 px-5 dark:bg-white/5">
                    <span className="truncate font-mono text-[11px] text-zinc-600 dark:text-zinc-400">{paymentUrl}</span>
                  </div>
                  <Button size="icon" variant="outline" onClick={() => handleCopy(paymentUrl, "Link")} className="h-14 w-14 shrink-0 rounded-2xl border-zinc-200 dark:border-white/10">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {boletoUrl && (
              <div className="border-t border-zinc-100 pt-5 dark:border-white/5">
                <Button
                  variant="outline"
                  onClick={() => window.open(boletoUrl, "_blank")}
                  className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border-zinc-200 bg-zinc-100 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 dark:border-white/10 dark:bg-white/5"
                >
                  <Barcode className="h-4 w-4" />
                  Visualizar boleto
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 gap-4 border-t border-zinc-100 bg-white p-8 dark:border-white/5 dark:bg-black/20">
        <Button onClick={handleShare} className="h-16 flex-1 gap-3 rounded-[20px] bg-zinc-900 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-2xl transition-all hover:opacity-90 active:scale-95 dark:bg-white dark:text-black">
          <Share2 className="h-4 w-4" />
          Enviar no WhatsApp
        </Button>
        <Button variant="ghost" onClick={() => handleOpenChange(false)} className="h-16 rounded-[20px] px-8 text-[10px] font-black uppercase tracking-widest text-zinc-500">
          Fechar
        </Button>
      </div>
    </div>
  );

  const renderForm = () => (
    <div className="flex h-full max-h-[inherit] flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-8 pb-6 pt-8 dark:border-white/5">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">Nova cobrança</h2>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 w-10 rounded-full bg-zinc-900 dark:bg-white" />
            <div className="h-1.5 w-6 rounded-full bg-zinc-200 dark:bg-white/10" />
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => handleOpenChange(false)} className="h-10 w-10 rounded-full hover:bg-zinc-100 dark:hover:bg-white/5">
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto bg-zinc-50/30 px-8 py-8 dark:bg-transparent">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
            {!isAccountReady && (
              <div className="flex items-center gap-4 rounded-3xl border border-amber-500/20 bg-amber-500/5 p-5">
                <AlertCircle className="h-5 w-5 shrink-0 text-amber-500" />
                <p className="text-xs font-bold leading-relaxed text-amber-600 dark:text-amber-400">
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
                    <FormLabel className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Valor da sessão (R$)</FormLabel>
                    <FormControl>
                      <div className="group relative">
                        <span className="absolute left-7 top-1/2 -translate-y-1/2 text-xl font-black text-zinc-300 dark:text-zinc-600">R$</span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(event) => field.onChange(event.target.value === "" ? undefined : Number(event.target.value))}
                          className="h-20 rounded-[28px] border-zinc-200 bg-white pl-16 text-4xl font-black text-zinc-900 shadow-sm transition-all focus:border-zinc-400 focus:ring-0 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white/20"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-[10px] font-bold text-red-500" />
                  </FormItem>
                )}
              />

              <div className="flex flex-wrap items-center gap-2 px-1">
                {QUICK_AMOUNTS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => form.setValue("amount", value, { shouldValidate: true })}
                    className={cn(
                      "rounded-full border px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95",
                      Number(watchedAmount) === value
                        ? "border-transparent bg-zinc-900 text-white shadow-xl dark:bg-white dark:text-black"
                        : "border-zinc-100 bg-white text-zinc-400 hover:border-zinc-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20"
                    )}
                  >
                    R$ {value}
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
                    <FormLabel className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Paciente</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-16 rounded-[24px] border-zinc-200 bg-white px-7 text-sm font-bold text-zinc-900 shadow-sm focus:ring-0 dark:border-white/10 dark:bg-white/5 dark:text-white">
                          <div className="flex items-center gap-3">
                            <UserIcon className="h-4 w-4 text-zinc-400" />
                            <SelectValue placeholder="Selecione o paciente..." />
                          </div>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl border-zinc-100 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-950">
                        {patients?.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id} className="cursor-pointer px-5 py-4 text-sm font-bold text-zinc-900 focus:bg-zinc-50 dark:text-zinc-100 dark:focus:bg-white/5">
                            {patient.name}
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
                    <FormLabel className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Descrição</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ex: Sessão de Psicoterapia"
                        className="h-16 rounded-[24px] border-zinc-200 bg-white px-7 text-sm font-bold text-zinc-900 placeholder:text-zinc-300 dark:border-white/10 dark:bg-white/5 dark:text-white"
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
                    <FormLabel className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Métodos de pagamento</FormLabel>
                    <ToggleGroup
                      type="multiple"
                      value={field.value}
                      onValueChange={(value) => field.onChange(value.length > 0 ? value : field.value)}
                      className="grid grid-cols-3 gap-4"
                    >
                      {[
                        { value: "pix", label: "Pix", icon: QrCode },
                        { value: "card", label: "Cartão", icon: CreditCard },
                        { value: "boleto", label: "Boleto", icon: Barcode },
                      ].map((method) => (
                        <ToggleGroupItem
                          key={method.value}
                          value={method.value}
                          className="flex h-28 flex-col gap-3 rounded-[28px] border-2 border-zinc-100 bg-white text-zinc-400 transition-all data-[state=on]:border-zinc-900 data-[state=on]:text-zinc-900 dark:border-white/5 dark:bg-white/5 dark:data-[state=on]:border-white dark:data-[state=on]:text-white"
                        >
                          <method.icon className="h-6 w-6" />
                          <span className="text-[9px] font-black uppercase tracking-widest">{method.label}</span>
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-zinc-100 bg-white p-8 dark:border-white/5 dark:bg-black/20">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total a cobrar</span>
          <span className="text-xl font-black text-zinc-900 dark:text-white">
            {watchedAmount ? Number(watchedAmount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "R$ 0,00"}
          </span>
        </div>
        <Button
          type="button"
          onClick={form.handleSubmit(onSubmit)}
          disabled={isCreating}
          className="h-16 gap-3 rounded-[20px] bg-zinc-900 px-12 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-2xl transition-all hover:opacity-90 active:scale-95 dark:bg-white dark:text-black"
        >
          {isCreating ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Gerar cobrança <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </div>
    </div>
  );

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={handleOpenChange}
      trigger={children || <Button className="h-12 rounded-full bg-zinc-900 px-8 text-[10px] font-black uppercase tracking-widest text-white dark:bg-white dark:text-black">Gerar cobrança</Button>}
      className="flex h-[90vh] flex-col overflow-hidden rounded-[40px] border border-zinc-200 bg-white p-0 shadow-2xl dark:border-white/10 dark:bg-zinc-950 sm:max-w-[650px]"
    >
      <div className="flex h-full flex-col overflow-hidden">
        {step === "success" ? renderSuccess() : renderForm()}
      </div>
    </ResponsiveModal>
  );
});

NewInvoiceModal.displayName = "NewInvoiceModal";
