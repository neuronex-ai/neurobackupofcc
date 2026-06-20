import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Building2, FileCheck2 } from "lucide-react";
import { motion } from "framer-motion";
import { useFiscalSettings } from "@/hooks/use-fiscal-settings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const fiscalSchema = z.object({
  company_name: z.string().min(1, "Razão Social é obrigatória"),
  cnpj: z.string().min(14, "CNPJ inválido"),
  municipal_inscription: z.string().min(1, "Inscrição Municipal obrigatória"),
  service_code: z.string().min(1, "Código de Serviço obrigatório"),
  iss_aliquot: z.coerce.number().min(0).max(100),
  rps_serie: z.string().default("1"),
  rps_number: z.coerce.number(),
  focus_nfe_api_key: z.string().optional(),
  focus_nfe_environment: z.enum(["homologacao", "producao"]).default("homologacao"),
  municipal_code: z.string().optional(),
  auto_issue: z.boolean().default(false),
  fiscal_provider: z.literal("asaas").default("asaas"),
  fiscal_email: z.string().email("Email fiscal invalido").optional().or(z.literal("")),
  simples_nacional: z.boolean().default(true),
  cultural_projects_promoter: z.boolean().default(false),
  cnae: z.string().optional(),
  special_tax_regime: z.string().optional(),
  service_list_item: z.string().optional(),
  nbs_code: z.string().optional(),
  retain_iss: z.boolean().default(false),
  pis_aliquot: z.coerce.number().min(0).max(100).default(0),
  cofins_aliquot: z.coerce.number().min(0).max(100).default(0),
  csll_aliquot: z.coerce.number().min(0).max(100).default(0),
  inss_aliquot: z.coerce.number().min(0).max(100).default(0),
  ir_aliquot: z.coerce.number().min(0).max(100).default(0),
  asaas_municipal_service_id: z.string().optional(),
  asaas_municipal_service_name: z.string().optional(),
});

type FiscalFormValues = z.infer<typeof fiscalSchema>;

export const FiscalConfigPanel = () => {
  const { settings, isLoading, saveSettings, isSaving } = useFiscalSettings();
  const [municipalServices, setMunicipalServices] = useState<Array<{ id: string; description: string; issTax?: number }>>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);

  const form = useForm<FiscalFormValues>({
    resolver: zodResolver(fiscalSchema),
    defaultValues: {
      company_name: "",
      cnpj: "",
      municipal_inscription: "",
      service_code: "0",
      iss_aliquot: 2,
      rps_serie: "1",
      rps_number: 1,
      focus_nfe_api_key: "",
      focus_nfe_environment: "homologacao",
      municipal_code: "",
      auto_issue: false,
      fiscal_provider: "asaas",
      fiscal_email: "",
      simples_nacional: true,
      cultural_projects_promoter: false,
      cnae: "",
      special_tax_regime: "",
      service_list_item: "",
      nbs_code: "",
      retain_iss: false,
      pis_aliquot: 0,
      cofins_aliquot: 0,
      csll_aliquot: 0,
      inss_aliquot: 0,
      ir_aliquot: 0,
      asaas_municipal_service_id: "",
      asaas_municipal_service_name: "",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        company_name: settings.company_name || "",
        cnpj: settings.cnpj || "",
        municipal_inscription: settings.municipal_inscription || "",
        service_code: settings.service_code || "",
        iss_aliquot: settings.iss_aliquot || 2,
        rps_serie: settings.rps_serie || "1",
        rps_number: settings.rps_number || 1,
        focus_nfe_api_key: (settings as any).focus_nfe_api_key || "",
        focus_nfe_environment: (settings as any).focus_nfe_environment || "homologacao",
        municipal_code: (settings as any).municipal_code || "",
        auto_issue: settings.auto_issue || false,
        fiscal_provider: "asaas",
        fiscal_email: settings.fiscal_email || "",
        simples_nacional: settings.simples_nacional ?? true,
        cultural_projects_promoter: settings.cultural_projects_promoter ?? false,
        cnae: settings.cnae || "",
        special_tax_regime: settings.special_tax_regime || "",
        service_list_item: settings.service_list_item || "",
        nbs_code: settings.nbs_code || "",
        retain_iss: settings.retain_iss ?? false,
        pis_aliquot: settings.pis_aliquot || 0,
        cofins_aliquot: settings.cofins_aliquot || 0,
        csll_aliquot: settings.csll_aliquot || 0,
        inss_aliquot: settings.inss_aliquot || 0,
        ir_aliquot: settings.ir_aliquot || 0,
        asaas_municipal_service_id: settings.asaas_municipal_service_id || "",
        asaas_municipal_service_name: settings.asaas_municipal_service_name || "",
      });
    }
  }, [settings, form]);

  const loadMunicipalServices = async () => {
    setIsLoadingServices(true);
    try {
      const description = form.getValues("service_code") || "psicologia";
      const { data, error } = await supabase.functions.invoke("asaas-invoices", {
        body: {
          action: "municipal_services",
          description,
          limit: 100,
        },
      });

      if (error) throw new Error(error.message);
      setMunicipalServices(data?.data || []);
      if (!data?.data?.length) {
        toast.info("Nenhum servico municipal encontrado para esse filtro.");
      }
    } catch (error: any) {
      toast.error(`Erro ao buscar servicos Asaas: ${error.message}`);
    } finally {
      setIsLoadingServices(false);
    }
  };

  const selectMunicipalService = (serviceId: string) => {
    const service = municipalServices.find((item) => item.id === serviceId);
    if (!service) return;
    form.setValue("asaas_municipal_service_id", service.id, { shouldDirty: true });
    form.setValue("asaas_municipal_service_name", service.description, { shouldDirty: true });
    if (typeof service.issTax === "number") {
      form.setValue("iss_aliquot", service.issTax, { shouldDirty: true });
    }
  };

  const onSubmit = (data: FiscalFormValues) => {
    saveSettings(data);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground h-6 w-6" /></div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-3xl"
    >
      <div className="flex flex-col items-center gap-6 border-b border-border/10 pb-8 text-center md:flex-row md:items-center md:text-left md:justify-between">
        <div className="flex flex-col items-center gap-4 md:flex-row">
          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">Dados Fiscais</h2>
            <p className="text-sm text-muted-foreground font-medium max-w-sm mx-auto md:mx-0">Informações para emissão de Nota Fiscal de Serviço (NFS-e).</p>
          </div>
        </div>
        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={isSaving}
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-8 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95 active:shadow-none hover:-translate-y-0.5 w-full md:w-auto"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar Configurações"}
        </Button>
      </div>

      <Form {...form}>
        <form className="space-y-10">
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Prestador</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="company_name" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">Razão Social</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-secondary/40 dark:bg-secondary/20 border-border/10 h-12 rounded-xl focus:border-primary/50 transition-all focus:bg-secondary/30 dark:focus:bg-secondary/10" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="cnpj" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">CNPJ / CPF</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-secondary/40 dark:bg-secondary/20 border-border/10 h-12 rounded-xl focus:border-primary/50 transition-all focus:bg-secondary/30 dark:focus:bg-secondary/10" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="municipal_inscription" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">Inscrição Municipal</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-secondary/40 dark:bg-secondary/20 border-border/10 h-12 rounded-xl focus:border-primary/50 transition-all focus:bg-secondary/30 dark:focus:bg-secondary/10" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="municipal_code" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">Código IBGE Município</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-secondary/40 dark:bg-secondary/20 border-border/10 h-12 rounded-xl focus:border-primary/50 transition-all focus:bg-secondary/30 dark:focus:bg-secondary/10" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="fiscal_email" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">Email fiscal Asaas</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" className="bg-secondary/40 dark:bg-secondary/20 border-border/10 h-12 rounded-xl focus:border-primary/50 transition-all focus:bg-secondary/30 dark:focus:bg-secondary/10" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="cnae" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">CNAE</FormLabel>
                  <FormControl>
                    <Input {...field} className="bg-secondary/40 dark:bg-secondary/20 border-border/10 h-12 rounded-xl focus:border-primary/50 transition-all focus:bg-secondary/30 dark:focus:bg-secondary/10" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="simples_nacional" render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-6 rounded-2xl border border-border/10 bg-secondary/20 p-4">
                  <div>
                    <FormLabel className="text-sm font-bold">Simples Nacional</FormLabel>
                    <FormDescription className="text-[10px] text-muted-foreground">Enviado para o fiscalInfo da subconta Asaas.</FormDescription>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />

              <FormField control={form.control} name="cultural_projects_promoter" render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-6 rounded-2xl border border-border/10 bg-secondary/20 p-4">
                  <div>
                    <FormLabel className="text-sm font-bold">Incentivo cultural</FormLabel>
                    <FormDescription className="text-[10px] text-muted-foreground">Marque apenas quando aplicavel ao cadastro municipal.</FormDescription>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
            </div>
          </div>

          <div className="space-y-6 pt-6 border-t border-border/5">
            <div className="flex items-center gap-2 mb-2">
              <FileCheck2 className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Emissão automática via Asaas</h3>
            </div>

            <div className="space-y-6">
              <FormField control={form.control} name="auto_issue" render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-6 rounded-2xl border border-border/10 bg-secondary/20 p-4">
                  <div>
                    <FormLabel className="text-sm font-bold">Emitir NFS-e após confirmação do pagamento</FormLabel>
                    <FormDescription className="text-[10px] text-muted-foreground">A cobrança paga agenda automaticamente a nota pela API v3 da Asaas.</FormDescription>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />

              <div className="rounded-2xl border border-border/10 bg-secondary/20 p-4 space-y-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-bold">Servico municipal Asaas</p>
                    <p className="text-[10px] text-muted-foreground">Busca oficial da subconta para selecionar o codigo usado na NFS-e.</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={loadMunicipalServices} disabled={isLoadingServices}>
                    {isLoadingServices ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar servicos"}
                  </Button>
                </div>

                {municipalServices.length > 0 && (
                  <Select onValueChange={selectMunicipalService}>
                    <SelectTrigger className="h-12 rounded-xl bg-background/60">
                      <SelectValue placeholder="Selecionar servico municipal" />
                    </SelectTrigger>
                    <SelectContent>
                      {municipalServices.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="asaas_municipal_service_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">ID do serviço municipal Asaas</FormLabel>
                    <FormControl><Input {...field} className="bg-secondary/40 dark:bg-secondary/20 border-border/10 h-12 rounded-xl" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="asaas_municipal_service_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">Nome do serviço municipal</FormLabel>
                    <FormControl><Input {...field} className="bg-secondary/40 dark:bg-secondary/20 border-border/10 h-12 rounded-xl" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="service_code" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">Cód. Serviço (quando não houver ID)</FormLabel>
                    <FormControl><Input {...field} className="bg-secondary/40 dark:bg-secondary/20 border-border/10 h-12 rounded-xl" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="iss_aliquot" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">Alíquota ISS (%)</FormLabel>
                    <FormControl><Input {...field} type="number" step="0.01" className="bg-secondary/40 dark:bg-secondary/20 border-border/10 h-12 rounded-xl" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>
          </div>
        </form>
      </Form>
    </motion.div>
  );
};
