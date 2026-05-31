"use client";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInvitePatient } from "@/hooks/use-invite-patient";
import { usePatients } from "@/hooks/use-patients";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ChevronsUpDown, Loader2, Mail, MessageCircle, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const RapidInviteSchema = z.object({
    patientId: z.string().min(1, "Selecione um paciente"),
    name: z.string().min(1, "Nome é obrigatório"),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    phone: z.string().optional(),
    paymentType: z.string().default('manual'),
    price: z.string().optional()
});

type RapidInviteValues = z.infer<typeof RapidInviteSchema>;

export const ExpandClinicWidget = () => {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [comboboxOpen, setComboboxOpen] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState<'whatsapp' | 'email' | null>('whatsapp');
    const { mutate: invitePatient, isPending } = useInvitePatient();
    const { data: patients } = usePatients();

    const form = useForm<RapidInviteValues>({
        resolver: zodResolver(RapidInviteSchema),
        defaultValues: {
            patientId: "",
            name: "",
            email: "",
            phone: "",
            paymentType: "manual",
            price: "150"
        }
    });

    useEffect(() => {
        if (!open) {
            form.reset();
            setStep(1);
            setSelectedMethod('whatsapp');
        }
    }, [open, form]);

    const handlePatientSelect = (patientName: string) => {
        const selectedPatient = patients?.find(p => p.name === patientName);
        if (selectedPatient) {
            form.setValue("patientId", selectedPatient.id);
            form.setValue("name", selectedPatient.name);
            form.setValue("email", selectedPatient.email || "");
            form.setValue("phone", selectedPatient.phone || "");
        }
        setComboboxOpen(false);
    };

    const nextStep = async () => {
        const result = await form.trigger(["patientId", "name"]);
        if (result) setStep(2);
    };

    const onSubmit = (values: RapidInviteValues) => {
        invitePatient({
            patientId: values.patientId,
            options: {
                paymentType: values.paymentType,
                price: values.paymentType === 'charge' ? parseFloat(values.price || "0") : undefined,
                channel: selectedMethod || 'whatsapp'
            }
        }, {
            onSuccess: (data) => {
                if (selectedMethod === 'whatsapp' && values.phone && data.token) {
                    const firstName = values.name.split(' ')[0];
                    const link = `${window.location.origin}/confirmar-agendamento/${data.token}`;
                    const msg = `Olá *${firstName}*! 👋%0A%0AEstou lhe convidando para agendar uma nova sessão.%0A%0A*Link de Acesso:* ${link}%0A*Código de Segurança:* ${data.authCode}`;
                    window.open(`https://wa.me/${values.phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
                }
                setOpen(false);
                toast.success("Convite enviado!");
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div role="button" className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4 relative group cursor-pointer rounded-[32px]">
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-secondary/5 rounded-[32px] opacity-40 transition-opacity group-hover:opacity-100" />
                    <div className="relative z-10 w-14 h-14 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black flex items-center justify-center mb-1 transition-transform duration-500 group-hover:scale-110 shadow-2xl">
                        <UserPlus className="h-6 w-6" />
                    </div>
                    <div className="space-y-1 relative z-10">
                        <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Expandir Clínica</h3>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em]">Novas Conexões</p>
                    </div>
                </div>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden rounded-[40px] border-zinc-200 dark:border-white/10 bg-white dark:bg-[#080809] backdrop-blur-3xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.2)] dark:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]">
                <div className="p-10">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h2 className="text-2xl font-black text-black dark:text-white tracking-tighter">Convite Rápido</h2>
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-500/80/80 dark:text-zinc-500/80/80 mt-2">Etapa {step} de 2</p>
                        </div>
                        <div className="flex gap-1.5">
                            {[1, 2].map(i => (
                                <div key={i} className={cn("w-8 h-1 rounded-full transition-all duration-700", step >= i ? "bg-zinc-900 dark:bg-white" : "bg-zinc-100 dark:bg-white/10")} />
                            ))}
                        </div>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <AnimatePresence mode="wait">
                                {step === 1 ? (
                                    <motion.div 
                                        key="step1" 
                                        initial={{ opacity: 0, y: 10 }} 
                                        animate={{ opacity: 1, y: 0 }} 
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-6"
                                    >
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500/80/80 dark:text-zinc-500/80/80 ml-1">Paciente Alvo</Label>
                                                    <FormControl>
                                                        <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                                                            <PopoverTrigger asChild>
                                                                <Button variant="outline" className="w-full justify-between h-14 rounded-2xl border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-white/5 text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-all font-bold text-sm">
                                                                    {field.value || "Selecionar da base..."}
                                                                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-[360px] p-0 rounded-2xl border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-2xl">
                                                                <Command className="bg-transparent">
                                                                    <CommandInput placeholder="Filtrar pacientes..." className="border-none focus:ring-0" />
                                                                    <CommandList>
                                                                        <CommandEmpty className="py-6 text-[10px] text-zinc-500/80/80 uppercase tracking-widest text-center">Nenhum registro</CommandEmpty>
                                                                        <CommandGroup>
                                                                            {patients?.map((patient) => (
                                                                                <CommandItem key={patient.id} value={patient.name} onSelect={handlePatientSelect} className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/5 py-4 px-5">
                                                                                    <UserPlus className="mr-3 h-4 w-4 opacity-50" />
                                                                                    <span className="font-bold">{patient.name}</span>
                                                                                </CommandItem>
                                                                            ))}
                                                                        </CommandGroup>
                                                                    </CommandList>
                                                                </Command>
                                                            </PopoverContent>
                                                        </Popover>
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField control={form.control} name="email" render={({ field }) => (
                                                <FormItem className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500/80/80 dark:text-zinc-500/80/80 ml-1">Email</Label>
                                                    <Input {...field} className="h-12 rounded-xl bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/5 text-black dark:text-white text-xs font-bold" placeholder="---" />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="phone" render={({ field }) => (
                                                <FormItem className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500/80/80 dark:text-zinc-500/80/80 ml-1">WhatsApp</Label>
                                                    <Input {...field} className="h-12 rounded-xl bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/5 text-black dark:text-white text-xs font-bold" placeholder="---" />
                                                </FormItem>
                                            )} />
                                        </div>

                                        <Button type="button" onClick={nextStep} className="w-full h-16 bg-zinc-900 dark:bg-white text-white dark:text-black hover:scale-[1.02] active:scale-[0.98] rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl transition-all mt-6">
                                            Prosseguir <ArrowRight className="ml-3 h-4 w-4" />
                                        </Button>
                                    </motion.div>
                                ) : (
                                    <motion.div 
                                        key="step2" 
                                        initial={{ opacity: 0, y: 10 }} 
                                        animate={{ opacity: 1, y: 0 }} 
                                        exit={{ opacity: 0, y: -10 }}
                                        className="space-y-6"
                                    >
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500/80/80 dark:text-zinc-500/80/80 ml-1">Modelo de Pagamento</Label>
                                            <FormField control={form.control} name="paymentType" render={({ field }) => (
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <SelectTrigger className="h-14 rounded-2xl bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/5 text-black dark:text-white font-bold">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10">
                                                        <SelectItem value="manual" className="py-3 font-bold">Cobrança Externa</SelectItem>
                                                        <SelectItem value="charge" className="py-3 font-bold">Liquidação via NeuroFinance</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )} />
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500/80/80 dark:text-zinc-500/80/80 ml-1">Canal de Disparo</Label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button type="button" onClick={() => setSelectedMethod('whatsapp')} className={cn("flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border transition-all duration-500", selectedMethod === 'whatsapp' ? "bg-zinc-900 dark:bg-white border-transparent shadow-2xl scale-[1.02]" : "bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/5 opacity-50 hover:opacity-100")}>
                                                    <MessageCircle className={cn("h-6 w-6", selectedMethod === 'whatsapp' ? "text-white dark:text-black" : "text-emerald-500")} />
                                                    <span className={cn("text-[9px] font-black uppercase tracking-widest", selectedMethod === 'whatsapp' ? "text-white dark:text-black" : "text-zinc-500/80")}>WhatsApp</span>
                                                </button>
                                                <button type="button" onClick={() => setSelectedMethod('email')} className={cn("flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border transition-all duration-500", selectedMethod === 'email' ? "bg-zinc-900 dark:bg-white border-transparent shadow-2xl scale-[1.02]" : "bg-zinc-50 dark:bg-white/5 border-zinc-200 dark:border-white/5 opacity-50 hover:opacity-100")}>
                                                    <Mail className={cn("h-6 w-6", selectedMethod === 'email' ? "text-white dark:text-black" : "text-blue-500")} />
                                                    <span className={cn("text-[9px] font-black uppercase tracking-widest", selectedMethod === 'email' ? "text-white dark:text-black" : "text-zinc-500/80")}>Email</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 pt-6">
                                            <Button type="button" variant="ghost" onClick={() => setStep(1)} className="h-16 px-8 rounded-2xl text-zinc-400 hover:text-black dark:hover:text-white uppercase tracking-[0.2em] text-[10px] font-black hover:bg-zinc-100 dark:hover:bg-white/5">
                                                <ArrowLeft className="h-4 w-4" />
                                            </Button>
                                            <Button type="submit" disabled={isPending} className="flex-1 h-16 bg-zinc-900 dark:bg-white text-white dark:text-black hover:scale-[1.02] active:scale-[0.98] rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl transition-all">
                                                {isPending ? <Loader2 className="animate-spin" /> : "Enviar Convite"}
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    );
};
