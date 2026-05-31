"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Landmark, Plus, Trash2, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/auth/SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export const BankAccountsView = () => {
    const { session } = useAuth();
    const queryClient = useQueryClient();
    const [isAdding, setIsAdding] = useState(false);
    const [newData, setNewData] = useState({ holderName: "", pixKey: "", pixKeyType: "CPF" });

    const { data: accounts, isLoading } = useQuery({
        queryKey: ['user_bank_accounts'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('user_bank_accounts')
                .select('*')
                .eq('user_id', session?.user?.id);
            if (error) throw error;
            return data || [];
        }
    });

    const addMutation = useMutation({
        mutationFn: async (data: any) => {
            if (!data.pixKey || !data.holderName) throw new Error("Campos obrigatórios");
            const { error } = await supabase.from('user_bank_accounts').insert([{
                user_id: session?.user.id,
                holder_name: data.holderName,
                pix_key: data.pixKey,
                pix_key_type: data.pixKeyType,
                account_type: data.accountType,
                currency: 'BRL',
                is_primary: accounts?.length === 0,
                provider: 'asaas'
            }]).select();
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user_bank_accounts'] });
            setIsAdding(false);
            setNewData({ holderName: "", pixKey: "", pixKeyType: "CPF" });
            toast.success("Conta adicionada!");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('user_bank_accounts').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user_bank_accounts'] });
            toast.success("Conta removida");
        }
    });

    return (
        <div className="max-w-3xl mx-auto space-y-10">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight">Contas Bancárias</h3>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">Gerencie seus destinos de transferência</p>
                </div>
                {!isAdding && (
                    <Button onClick={() => setIsAdding(true)} className="h-12 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl px-6 font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all">
                        <Plus className="w-4 h-4 mr-2" /> Nova Conta
                    </Button>
                )}
            </div>

            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-8 rounded-[32px] bg-white dark:bg-white/[0.02] border border-zinc-200 dark:border-white/10 shadow-2xl space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 md:col-span-2">
                                    <Label className="text-[9px] font-black uppercase tracking-widest ml-1">Titular</Label>
                                    <Input
                                        value={newData.holderName}
                                        onChange={e => setNewData({ ...newData, holderName: e.target.value })}
                                        className="h-14 bg-zinc-50 dark:bg-white/[0.01] border-zinc-200 dark:border-white/5 rounded-xl font-bold"
                                        placeholder="Nome completo do beneficiário"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-black uppercase tracking-widest ml-1">Tipo de Chave</Label>
                                    <select
                                        value={newData.pixKeyType}
                                        onChange={e => setNewData({ ...newData, pixKeyType: e.target.value })}
                                        className="w-full h-14 bg-zinc-50 dark:bg-white/[0.01] border border-zinc-200 dark:border-white/5 rounded-xl px-4 text-xs font-bold"
                                    >
                                        <option value="CPF">CPF</option>
                                        <option value="CNPJ">CNPJ</option>
                                        <option value="EMAIL">E-mail</option>
                                        <option value="PHONE">Telefone</option>
                                        <option value="EVP">Aleatória</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-black uppercase tracking-widest ml-1">Chave PIX</Label>
                                    <Input
                                        value={newData.pixKey}
                                        onChange={e => setNewData({ ...newData, pixKey: e.target.value })}
                                        className="h-14 bg-zinc-50 dark:bg-white/[0.01] border-zinc-200 dark:border-white/5 rounded-xl font-mono"
                                        placeholder="..."
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <Button variant="ghost" onClick={() => setIsAdding(false)} className="h-12 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest">Cancelar</Button>
                                <Button onClick={() => addMutation.mutate(newData)} disabled={addMutation.isPending} className="h-12 px-8 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl">
                                    {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar Conta"}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid gap-4">
                {isLoading ? (
                    <div className="py-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-zinc-200" /></div>
                ) : accounts?.map((acc: any) => (
                    <div key={acc.id} className="group p-6 rounded-[32px] bg-white dark:bg-white/[0.01] border border-zinc-200/50 dark:border-white/[0.05] hover:border-primary/20 hover:shadow-xl transition-all flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-[22px] bg-zinc-50 dark:bg-white/[0.02] border border-zinc-100 dark:border-white/5 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                                <Landmark className="w-8 h-8 text-zinc-400" />
                            </div>
                            <div>
                                <p className="text-[13px] font-black uppercase tracking-tight">{acc.holder_name}</p>
                                <div className="flex items-center gap-3 mt-1.5">
                                    <span className="text-[10px] font-mono text-zinc-400 font-bold">{acc.pix_key_type}: {acc.pix_key}</span>
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 opacity-50" />
                                </div>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(acc.id)}
                            disabled={deleteMutation.isPending}
                            className="w-12 h-12 rounded-2xl text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <Trash2 className="w-5 h-5" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
};