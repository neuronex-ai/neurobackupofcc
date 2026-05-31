import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Trash2, Split, Building2, Users, GraduationCap, X, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatCurrency } from '@/lib/utils';

interface SplitConfig {
    id: string;
    recipient_type: 'clinic' | 'professional' | 'supervisor';
    recipient_name: string;
    recipient_email?: string;
    recipient_wallet_id?: string;
    split_type: 'percentage' | 'fixed';
    split_value: number;
    is_active: boolean;
}

export const SmartSplit = () => {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newSplit, setNewSplit] = useState<Partial<SplitConfig>>({
        recipient_type: 'professional',
        split_type: 'percentage',
        is_active: true
    });

    // Fetch configs
    const { data: configs, isLoading } = useQuery({
        queryKey: ['paymentSplitConfigs'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('payment_split_configs')
                .select('*')
                .order('created_at', { ascending: true });
            if (error) throw error;
            return data as SplitConfig[];
        }
    });

    // Create mutation
    const createMutation = useMutation({
        mutationFn: async (config: Partial<SplitConfig>) => {
            if (!config.recipient_name || !config.split_value) throw new Error("Preencha todos os campos obrigatórios");

            const { data, error } = await supabase
                .from('payment_split_configs')
                .insert([{
                    recipient_type: config.recipient_type,
                    recipient_name: config.recipient_name,
                    recipient_email: config.recipient_email,
                    recipient_wallet_id: config.recipient_wallet_id,
                    split_type: config.split_type,
                    split_value: config.split_value,
                    user_id: (await supabase.auth.getUser()).data.user?.id
                }]);

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['paymentSplitConfigs'] });
            setIsDialogOpen(false);
            setNewSplit({ recipient_type: 'professional', split_type: 'percentage', is_active: true });
            toast.success("Regra de split criada!");
        },
        onError: (err) => toast.error(`Erro: ${err.message}`)
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('payment_split_configs').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['paymentSplitConfigs'] });
            toast.success("Regra removida.");
        }
    });

    // Toggle active mutation
    const toggleMutation = useMutation({
        mutationFn: async ({ id, is_active }: { id: string, is_active: boolean }) => {
            const { error } = await supabase.from('payment_split_configs').update({ is_active }).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['paymentSplitConfigs'] })
    });

    const totalSplitPercentage = configs?.filter(c => c.is_active && c.split_type === 'percentage')
        .reduce((acc, curr) => acc + curr.split_value, 0) || 0;

    const myShare = Math.max(0, 100 - totalSplitPercentage);

    const getSplitColor = (index: number) => {
        const shades = ['bg-zinc-300', 'bg-zinc-400', 'bg-zinc-500', 'bg-zinc-600', 'bg-zinc-700'];
        return shades[index % shades.length];
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'clinic': return <Building2 className="w-5 h-5" />;
            case 'supervisor': return <GraduationCap className="w-5 h-5" />;
            default: return <Users className="w-5 h-5" />;
        }
    };

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-zinc-200 dark:text-white/10" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Carregando configurações</p>
        </div>
    );

    return (
        <div className="space-y-12 pb-20 p-2">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4 px-2">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 mb-1">
                        <Zap className="w-4 h-4 text-zinc-900 dark:text-white" />
                        <h3 className="text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.6em]">Divisão de Pagamentos</h3>
                    </div>
                    <p className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter">Regras de Divisão</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <motion.button
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            className="h-16 px-10 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-[24px] font-black uppercase text-[10px] tracking-[0.4em] shadow-3xl transition-all"
                        >
                            Nova Regra de Divisão
                        </motion.button>
                    </DialogTrigger>
                    <DialogContent className="bg-white/95 dark:bg-[#0A0A0C]/95 backdrop-blur-[64px] border border-zinc-200 dark:border-white/10 rounded-[48px] p-0 shadow-3xl overflow-hidden sm:max-w-md outline-none z-[10000]">
                        <DialogHeader className="p-10 border-b border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.02]">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-[24px] bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-black shadow-2xl">
                                        <Split className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">Nova Regra</DialogTitle>
                                        <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em] mt-1">Configure a divisão de pagamentos</p>
                                    </div>
                                </div>
                                <DialogClose asChild>
                                    <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full"><X className="h-5 w-5" /></Button>
                                </DialogClose>
                            </div>
                        </DialogHeader>

                        <div className="p-10 space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest pl-1">Beneficiário</label>
                                    <Select value={newSplit.recipient_type} onValueChange={(v: any) => setNewSplit({ ...newSplit, recipient_type: v })}>
                                        <SelectTrigger className="bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 h-14 rounded-2xl text-[11px] font-black tracking-widest px-6 focus:ring-0">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-white/10 rounded-2xl">
                                            <SelectItem value="professional" className="text-[10px] font-black py-4 uppercase tracking-widest">Parceiro</SelectItem>
                                            <SelectItem value="clinic" className="text-[10px] font-black py-4 uppercase tracking-widest">Clínica</SelectItem>
                                            <SelectItem value="supervisor" className="text-[10px] font-black py-4 uppercase tracking-widest">Supervisor</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest pl-1">Divisão</label>
                                    <Select value={newSplit.split_type} onValueChange={(v: any) => setNewSplit({ ...newSplit, split_type: v })}>
                                        <SelectTrigger className="bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 h-14 rounded-2xl text-[11px] font-black tracking-widest px-6 focus:ring-0">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-white/10 rounded-2xl">
                                            <SelectItem value="percentage" className="text-[10px] font-black py-4 uppercase tracking-widest">Porcentagem (%)</SelectItem>
                                            <SelectItem value="fixed" className="text-[10px] font-black py-4 uppercase tracking-widest">Valor Fixo (R$)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest pl-1">Nome Identificador</label>
                                <Input
                                    placeholder="EX: CLÍNICA NEUROSENSORIAL"
                                    className="bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest px-6 shadow-sm"
                                    value={newSplit.recipient_name || ''}
                                    onChange={e => setNewSplit({ ...newSplit, recipient_name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest pl-1">Wallet ID (NeuroFinance)</label>
                                <Input
                                    placeholder="ACCT_..."
                                    className="bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 h-14 rounded-2xl text-[11px] font-black px-6 shadow-sm"
                                    value={newSplit.recipient_wallet_id || ''}
                                    onChange={e => setNewSplit({ ...newSplit, recipient_wallet_id: e.target.value })}
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest pl-1">Valor da Divisão</label>
                                <Input
                                    type="number"
                                    placeholder="EX: 30"
                                    className="bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 h-14 rounded-2xl text-[13px] font-black px-6 shadow-sm"
                                    value={newSplit.split_value || ''}
                                    onChange={e => setNewSplit({ ...newSplit, split_value: parseFloat(e.target.value) })}
                                />
                            </div>

                            <Button
                                onClick={() => createMutation.mutate(newSplit)}
                                disabled={createMutation.isPending}
                                className="w-full h-16 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase text-[10px] tracking-[0.4em] shadow-3xl hover:opacity-90 transition-all active:scale-[0.98] mt-4"
                            >
                                {createMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "Criar Regra"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Visual Distribution Summary */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-[#0A0A0B] border border-zinc-200 dark:border-white/5 rounded-[56px] p-12 shadow-3xl relative overflow-hidden group"
            >
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] dark:opacity-[0.05] pointer-events-none" />

                <div className="flex items-center justify-between mb-10 relative z-10">
                    <div className="space-y-1">
                        <h4 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.5em]">Distribuição</h4>
                        <p className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter">Visão Geral</p>
                    </div>
                </div>

                <div className="space-y-10 relative z-10">
                    <div className="h-20 w-full bg-zinc-100 dark:bg-white/[0.04] rounded-[28px] overflow-hidden flex border border-zinc-200 dark:border-white/5 p-1.5 shadow-inner">
                        <AnimatePresence mode="popLayout">
                            {/* My Share */}
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${myShare}%` }}
                                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                                className="h-full bg-zinc-900 dark:bg-white rounded-[22px] flex items-center justify-center text-[11px] font-black text-white dark:text-black transition-all shadow-xl group/share relative"
                            >
                                {myShare > 10 && (
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4" />
                                        <span>SUA PARTE: {myShare}%</span>
                                    </div>
                                )}
                            </motion.div>

                            {/* Splits */}
                            {configs?.filter(c => c.is_active && c.split_type === 'percentage').map((config, index) => (
                                <motion.div
                                    key={config.id}
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: `${config.split_value}%`, opacity: 1 }}
                                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 * index }}
                                    className={cn("h-full flex items-center justify-center text-[10px] font-black text-white border-l border-white/10 transition-all rounded-[22px] ml-1", getSplitColor(index))}
                                >
                                    {config.split_value > 8 && `${config.split_value}%`}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                        <div className="flex items-center gap-4 group/item">
                            <div className="w-4 h-4 rounded-full bg-zinc-900 dark:bg-white shadow-lg group-hover/item:scale-125 transition-transform" />
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Sua Parte</p>
                                <p className="text-xl font-black text-zinc-900 dark:text-white tracking-tighter">{myShare}%</p>
                            </div>
                        </div>
                        {configs?.filter(c => c.is_active).map((config, index) => (
                            <div key={config.id} className="flex items-center gap-4 group/item">
                                <div className={cn("w-4 h-4 rounded-full shadow-lg group-hover/item:scale-125 transition-transform", getSplitColor(index))} />
                                <div className="space-y-1 min-w-0">
                                    <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest truncate">{config.recipient_name}</p>
                                    <p className="text-xl font-black text-zinc-900 dark:text-white tracking-tighter">
                                        {config.split_type === 'percentage' ? `${config.split_value}%` : formatCurrency(config.split_value)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Split Rules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-2">
                {configs?.map((config, idx) => (
                    <motion.div
                        key={config.id}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                        className={cn(
                            "group relative bg-white dark:bg-[#0A0A0B] border border-zinc-200/60 dark:border-white/5 rounded-[48px] p-8 shadow-sm transition-all duration-700 hover:shadow-3xl hover:border-zinc-400 dark:hover:border-white/20",
                            !config.is_active && "opacity-60 grayscale"
                        )}
                    >
                        {/* Noise Texture */}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] dark:opacity-[0.04] pointer-events-none" />

                        <div className="flex items-center justify-between mb-10 relative z-10">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 rounded-[24px] bg-zinc-50 dark:bg-white/[0.03] border border-zinc-100 dark:border-white/5 flex items-center justify-center text-zinc-400 dark:text-zinc-600 transition-all duration-700 group-hover:rotate-6 group-hover:scale-110">
                                    {getTypeIcon(config.recipient_type)}
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tighter truncate max-w-[140px] block group-hover:text-primary transition-colors">{config.recipient_name}</h4>
                                    <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em] mt-1">ID: {config.id.slice(0, 8).toUpperCase()}</p>
                                </div>
                            </div>
                            <div className="p-3 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/5 rounded-2xl flex items-center justify-center">
                                <Sparkles className={cn("w-4 h-4 transition-all duration-700", config.is_active ? "text-zinc-900 dark:text-white scale-110 animate-pulse" : "text-zinc-200 dark:text-white/5")} />
                            </div>
                        </div>

                        <div className="space-y-1 mb-10 relative z-10">
                            <div className="flex items-baseline gap-3">
                                <span className="text-[11px] font-black uppercase tracking-widest text-zinc-300 dark:text-zinc-700">VALOR</span>
                                <h5 className="text-5xl font-black text-zinc-900 dark:text-white tracking-[-0.08em]">
                                    {config.split_type === 'percentage' ? `${config.split_value}%` : formatCurrency(config.split_value).replace('R$', '').trim()}
                                </h5>
                                {config.split_type === 'fixed' && <span className="text-[12px] font-black text-zinc-300 dark:text-zinc-700">BRL</span>}
                            </div>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                <Zap className="w-3 h-3 opacity-50" /> Conta: {config.recipient_wallet_id ? `...${config.recipient_wallet_id.slice(-6)}` : 'OFFLINE'}
                            </p>
                        </div>

                        <div className="flex items-center justify-between pt-8 border-t border-zinc-100 dark:border-white/5 relative z-10">
                            <div className="flex items-center gap-4">
                                <Switch
                                    checked={config.is_active}
                                    onCheckedChange={(chk) => toggleMutation.mutate({ id: config.id, is_active: chk })}
                                    className="data-[state=checked]:bg-zinc-900 dark:data-[state=checked]:bg-white data-[state=unchecked]:bg-zinc-200 dark:data-[state=unchecked]:bg-zinc-800 scale-90"
                                />
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{config.is_active ? 'Ativo' : 'Pausado'}</span>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 10 }}
                                whileTap={{ scale: 0.9 }}
                                className="h-12 w-12 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] text-zinc-300 hover:text-rose-500 hover:bg-rose-500/10 transition-all flex items-center justify-center shadow-lg"
                                onClick={() => {
                                    if (confirm('Deseja excluir esta regra de divisão?')) deleteMutation.mutate(config.id);
                                }}
                            >
                                <Trash2 className="w-5 h-5" />
                            </motion.button>
                        </div>
                    </motion.div>
                ))}

                {!configs?.length && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="col-span-full py-32 flex flex-col items-center justify-center text-center border-2 border-dashed border-zinc-200 dark:border-white/10 rounded-[64px] bg-zinc-50/50 dark:bg-white/[0.01]"
                    >
                        <div className="w-24 h-24 rounded-[40px] bg-white dark:bg-[#0A0A0C] border border-zinc-100 dark:border-white/10 flex items-center justify-center mb-10 shadow-3xl">
                            <Split className="w-10 h-10 text-zinc-200 dark:text-white/5" />
                        </div>
                        <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase">Nenhuma Regra Configurada</h3>
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-600 font-bold uppercase tracking-[0.4em] mt-4 max-w-sm leading-relaxed">
                            Crie regras para dividir pagamentos automaticamente entre profissionais e parceiros.
                        </p>
                        <Button
                            className="mt-10 h-16 px-12 rounded-[24px] bg-zinc-900 dark:bg-white text-white dark:text-black hover:opacity-90 font-black text-[10px] uppercase tracking-[0.4em] shadow-3xl transition-all"
                            onClick={() => setIsDialogOpen(true)}
                        >
                            Criar Primeira Regra
                        </Button>
                    </motion.div>
                )}
            </div>
        </div>
    );
};
