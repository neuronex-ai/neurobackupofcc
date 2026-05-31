"use client";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAddPatient } from "@/hooks/use-add-patient";
import { cn } from "@/lib/utils";
import { NewPatientFormValues, NewPatientSchema } from "@/lib/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, isValid, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, AlertTriangle, ArrowLeft, ArrowRight, Calendar as CalendarIcon, Check, CreditCard, FileText, Loader2, Mail, MapPin, Phone, Pill, Plus, Trash2, User, Wallet } from "lucide-react";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

interface NewPatientFormProps {
  onSuccess: () => void;
}

export const NewPatientForm = ({ onSuccess }: NewPatientFormProps) => {
  const { mutate, isPending } = useAddPatient();
  const [step, setStep] = useState(1);
  const [dateInputValue, setDateInputValue] = useState("");

  const form = useForm<NewPatientFormValues>({
    resolver: zodResolver(NewPatientSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      cpf: "",
      diagnosis: "",
      notes: "",
      birth_date: undefined,
      address: "",
      emergency_name: "",
      emergency_phone: "",
      payer_type: "patient",
      payer_name: "",
      payer_cpf: "",
      medications: []
    },
  });

  const { fields: medFields, append: appendMed, remove: removeMed } = useFieldArray({
    control: form.control,
    name: "medications"
  });

  const payerType = form.watch("payer_type");

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, onChange: (date: Date | undefined) => void) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);

    if (value.length >= 5) {
      value = `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`;
    } else if (value.length >= 3) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }

    setDateInputValue(value);

    if (value.length === 10) {
      const parsedDate = parse(value, 'dd/MM/yyyy', new Date());
      if (isValid(parsedDate) && parsedDate.getFullYear() > 1900) {
        onChange(parsedDate);
      }
    } else if (value.length === 0) {
      onChange(undefined);
    }
  };

  const onSubmit = (values: NewPatientFormValues) => {
    if (values.cpf) values.cpf = values.cpf.replace(/\D/g, '');
    if (values.payer_cpf) values.payer_cpf = values.payer_cpf.replace(/\D/g, '');

    mutate(values, {
      onSuccess: () => {
        toast.success("Prontuário criado com sucesso!");
        form.reset();
        setDateInputValue("");
        onSuccess();
      },
      onError: (error) => {
        toast.error(`Erro ao adicionar paciente: ${error.message}`);
      },
    });
  };

  const validateStep = async (s: number) => {
    let fields: any[] = [];
    if (s === 1) fields = ["name", "birth_date", "cpf"];
    if (s === 2) fields = ["email", "phone", "address"];
    
    const result = await form.trigger(fields);
    if (result) setStep(s + 1);
  };

  const inputStyle = "bg-zinc-50 dark:bg-white/[0.03] border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10 h-14 rounded-2xl transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-700 text-zinc-900 dark:text-white font-bold text-sm shadow-sm";
  const labelStyle = "flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-500 font-black mb-3 ml-1";

  return (
    <Form {...form}>
      <div className="flex gap-1.5 mb-10 justify-center">
        {[1, 2, 3, 4].map(i => (
            <div key={i} className={cn("h-1 rounded-full transition-all duration-700", step >= i ? "w-10 bg-zinc-900 dark:bg-white" : "w-4 bg-zinc-100 dark:bg-white/10")} />
        ))}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <AnimatePresence mode="wait">
            {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem>
                            <FormLabel className={labelStyle}><User className="h-3.5 w-3.5" /> Identidade Clínica</FormLabel>
                            <FormControl><Input placeholder="Nome Completo do Paciente" {...field} className={inputStyle} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="birth_date" render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel className={labelStyle}><CalendarIcon className="h-3.5 w-3.5" /> Nascimento</FormLabel>
                                <div className="relative">
                                    <FormControl>
                                        <Input placeholder="DD/MM/AAAA" value={dateInputValue} onChange={(e) => handleDateChange(e, field.onChange)} className={cn(inputStyle, "pr-12 font-mono")} maxLength={10} />
                                    </FormControl>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-14 w-14 rounded-r-2xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all"><CalendarIcon className="h-5 w-5" /></Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 shadow-2xl rounded-3xl" align="end">
                                            <Calendar mode="single" selected={field.value} onSelect={(date) => { field.onChange(date); if (date) setDateInputValue(format(date, 'dd/MM/yyyy')); }} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus locale={ptBR} className="p-4" />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="cpf" render={({ field }) => (
                            <FormItem>
                                <FormLabel className={labelStyle}><CreditCard className="h-3.5 w-3.5" /> CPF</FormLabel>
                                <FormControl><Input placeholder="000.000.000-00" {...field} className={inputStyle} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                    <Button type="button" onClick={() => validateStep(1)} className="w-full h-16 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all">Prosseguir <ArrowRight className="ml-3 h-4 w-4" /></Button>
                </motion.div>
            )}

            {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem>
                                <FormLabel className={labelStyle}><Mail className="h-3.5 w-3.5" /> E-mail</FormLabel>
                                <FormControl><Input placeholder="contato@paciente.com" {...field} className={inputStyle} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="phone" render={({ field }) => (
                            <FormItem>
                                <FormLabel className={labelStyle}><Phone className="h-3.5 w-3.5" /> WhatsApp</FormLabel>
                                <FormControl><Input placeholder="(99) 99999-9999" {...field} className={inputStyle} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>

                    <FormField control={form.control} name="address" render={({ field }) => (
                        <FormItem>
                            <FormLabel className={labelStyle}><MapPin className="h-3.5 w-3.5" /> Localização</FormLabel>
                            <FormControl><Input placeholder="Endereço, Cidade - UF" {...field} className={inputStyle} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <div className="p-6 rounded-[32px] bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 space-y-4">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="h-4 w-4 text-rose-500" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Contatos de Emergência</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <FormField control={form.control} name="emergency_name" render={({ field }) => (
                                <Input placeholder="Nome Responsável" {...field} className="h-12 rounded-xl bg-white dark:bg-white/5 border-zinc-200 dark:border-white/5" />
                            )} />
                            <FormField control={form.control} name="emergency_phone" render={({ field }) => (
                                <Input placeholder="Telefone Emergência" {...field} className="h-12 rounded-xl bg-white dark:bg-white/5 border-zinc-200 dark:border-white/5" />
                            )} />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Button type="button" variant="ghost" onClick={() => setStep(1)} className="h-16 px-8 rounded-2xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-black uppercase tracking-widest text-[10px]"><ArrowLeft className="h-4 w-4" /></Button>
                        <Button type="button" onClick={() => validateStep(2)} className="flex-1 h-16 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl transition-all">Prosseguir <ArrowRight className="ml-3 h-4 w-4" /></Button>
                    </div>
                </motion.div>
            )}

            {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                    <FormField control={form.control} name="diagnosis" render={({ field }) => (
                        <FormItem>
                            <FormLabel className={labelStyle}><Activity className="h-3.5 w-3.5" /> Diagnóstico Base</FormLabel>
                            <FormControl><Input placeholder="TAG, TDAH, Depressão..." {...field} className={inputStyle} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <span className={labelStyle}><Pill className="h-3.5 w-3.5" /> Uso Medicamentoso</span>
                            <Button type="button" variant="ghost" onClick={() => appendMed({ name: "", dosage: "" })} className="h-8 text-[9px] uppercase font-black text-zinc-400 hover:text-zinc-900 dark:hover:text-white tracking-widest"><Plus className="h-3 w-3 mr-2" /> Adicionar</Button>
                        </div>
                        <div className="space-y-3">
                            {medFields.map((field, index) => (
                                <div key={field.id} className="flex gap-3 items-start animate-in slide-in-from-left-2 duration-300">
                                    <Input placeholder="Medicamento" className={cn(inputStyle, "flex-1 h-12")} {...form.register(`medications.${index}.name`)} />
                                    <Input placeholder="Dosagem" className={cn(inputStyle, "w-32 h-12 text-center")} {...form.register(`medications.${index}.dosage`)} />
                                    <Button type="button" variant="ghost" onClick={() => removeMed(index)} className="h-12 w-12 rounded-xl text-rose-500/50 hover:text-rose-500 hover:bg-rose-500/5"><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            ))}
                            {medFields.length === 0 && <div className="py-10 text-center border-2 border-dashed border-zinc-100 dark:border-white/5 rounded-[32px] text-[10px] font-black uppercase tracking-widest text-zinc-400 opacity-40 italic">Sem registros</div>}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Button type="button" variant="ghost" onClick={() => setStep(2)} className="h-16 px-8 rounded-2xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-black uppercase tracking-widest text-[10px]"><ArrowLeft className="h-4 w-4" /></Button>
                        <Button type="button" onClick={() => setStep(4)} className="flex-1 h-16 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl transition-all">Prosseguir <ArrowRight className="ml-3 h-4 w-4" /></Button>
                    </div>
                </motion.div>
            )}

            {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                    <div className="p-8 rounded-[40px] bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/10 space-y-6">
                        <div className="flex items-center gap-3">
                            <Wallet className="h-4 w-4 text-zinc-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Responsabilidade Financeira</span>
                        </div>
                        <FormField control={form.control} name="payer_type" render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger className="h-14 rounded-2xl bg-white dark:bg-white/5 border-zinc-200 dark:border-white/5 font-bold"><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent className="rounded-2xl border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-950 p-2"><SelectItem value="patient" className="rounded-xl font-bold py-3">O Próprio Paciente</SelectItem><SelectItem value="other" className="rounded-xl font-bold py-3">Responsável Financeiro</SelectItem></SelectContent>
                            </Select>
                        )} />
                        {payerType === 'other' && (
                            <div className="grid grid-cols-2 gap-3 pt-2 animate-in fade-in slide-in-from-top-2">
                                <Input placeholder="Nome do Responsável" className="h-12 rounded-xl bg-white dark:bg-white/5" {...form.register("payer_name")} />
                                <Input placeholder="CPF Responsável" className="h-12 rounded-xl bg-white dark:bg-white/5" {...form.register("payer_cpf")} />
                            </div>
                        )}
                    </div>

                    <FormField control={form.control} name="notes" render={({ field }) => (
                        <FormItem>
                            <FormLabel className={labelStyle}><FileText className="h-3.5 w-3.5" /> Notas de Entrada</FormLabel>
                            <FormControl><Textarea placeholder="Contexto inicial, queixas e observações primárias..." {...field} rows={4} className="bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/5 focus-within:border-zinc-300 dark:focus-within:border-white/15 resize-none rounded-[32px] p-6 text-sm font-medium shadow-inner" /></FormControl>
                        </FormItem>
                    )} />

                    <div className="flex gap-4">
                        <Button type="button" variant="ghost" onClick={() => setStep(3)} className="h-16 px-8 rounded-2xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white font-black uppercase tracking-widest text-[10px]"><ArrowLeft className="h-4 w-4" /></Button>
                        <Button type="submit" disabled={isPending} className="flex-1 h-16 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl transition-all">{isPending ? <Loader2 className="animate-spin h-5 w-5" /> : <div className="flex items-center gap-3"><Check className="h-4 w-4" /> Ativar Prontuário</div>}</Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </form>
    </Form>
  );
};
