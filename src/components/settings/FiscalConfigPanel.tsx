import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Building2, FileCheck2 } from "lucide-react";
import { motion } from "framer-motion";
import { useFiscalSettings } from "@/hooks/use-fiscal-settings";

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
});

type FiscalFormValues = z.infer<typeof fiscalSchema>;

export const FiscalConfigPanel = () => {
  const { settings, isLoading, saveSettings, isSaving } = useFiscalSettings();

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
      });
    }
  }, [settings, form]);

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
            </div>
          </div>

          <div className="space-y-6 pt-6 border-t border-border/5">
            <div className="flex items-center gap-2 mb-2">
              <FileCheck2 className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Integração Focus NFe</h3>
            </div>

            <div className="space-y-6">
              <FormField control={form.control} name="focus_nfe_api_key" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">API Key</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" className="bg-secondary/40 dark:bg-secondary/20 border-border/10 h-12 rounded-xl font-mono text-xs focus:border-primary/50 transition-all focus:bg-secondary/30 dark:focus:bg-secondary/10" />
                  </FormControl>
                  <FormDescription className="text-[10px] text-muted-foreground">Token de produção ou homologação da Focus NFe.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="focus_nfe_environment" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">Ambiente</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-secondary/40 dark:bg-secondary/20 border-border/10 h-12 rounded-xl focus:ring-0 focus:border-primary/50 transition-all">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover border-border/10 rounded-xl shadow-xl">
                        <SelectItem value="homologacao">Homologação (Teste)</SelectItem>
                        <SelectItem value="producao">Produção</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="service_code" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">Cód. Serviço (LC 116)</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-secondary/40 dark:bg-secondary/20 border-border/10 h-12 rounded-xl focus:border-primary/50 transition-all focus:bg-secondary/30 dark:focus:bg-secondary/10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="iss_aliquot" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">Alíquota ISS (%)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" className="bg-secondary/40 dark:bg-secondary/20 border-border/10 h-12 rounded-xl focus:border-primary/50 transition-all focus:bg-secondary/30 dark:focus:bg-secondary/10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="rps_serie" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">Série RPS</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-secondary/40 dark:bg-secondary/20 border-border/10 h-12 rounded-xl focus:border-primary/50 transition-all focus:bg-secondary/30 dark:focus:bg-secondary/10" />
                    </FormControl>
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