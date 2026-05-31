"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, Check, Landmark, ArrowRight } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { useNeuroFinanceBalance } from "@/hooks/use-neurofinance-balance";
import { useAuth } from "@/components/auth/SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useRequestPayout } from "@/hooks/use-neurobank-payouts";

export const BankTransferView = () => {
    const { session } = useAuth();
    const { data: balanceData } = useNeuroFinanceBalance();
    const balance = balanceData?.balance || 0;

    const [amount, setAmount] = useState("");
    const [selectedAccount, setSelectedAccount] = useState<any>(null);
    const [showPin, setShowPin] = useState(false);
    const [pin, setPin] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    const { data: accounts } = useQuery({
        queryKey: ['user_bank_accounts'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('user_bank_accounts')
                .select('*')
                .eq('user_id', session?.user?.id);
            if (error) throw error;
            return data || [];
        },
        enabled: !!session?.user?.id
    });

    const handleContinue = () => {
        const val = parseFloat(amount.replace(',', '.'));
        if (isNaN(val) || val <= 0) return toast.error("Valor inválido");
        if (val > balance) return toast.error("Saldo insuficiente");
        if (!selectedAccount) return toast.error("Selecione um destino");
        setShowPin(true);
    };

    const { mutateAsync: requestPayout } = useRequestPayout();

    const handleConfirm = async () => {
        if (pin.length < 4) return;
        setIsProcessing(true);
        try {
            const { data: isValid, error } = await supabase.rpc('verify_financial_pin', { pin_attempt: pin });
            if (error || !isValid) {
                toast.error("PIN incorreto");
                setPin("");
                return;
            }

            const val = parseFloat(amount.replace(',', '.'));
            const amountInCents = Math.round(val * 100);

            await requestPayout({
                amount: amountInCents,
                description: `Saque para ${selectedAccount?.holder_name || 'Conta Bancária'}`,
            });

            setAmount("");
            setSelectedAccount(null);
            setShowPin(false);
            setPin("");
        } catch (e: any) {
            // Error is handled by the hook
            console.error("Payout error:", e);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-md mx-auto py-8">
            <AnimatePresence mode="wait">
                {!showPin ? (
                    <motion.div
                        key="setup"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-8"
                    >
                        <div className="text-center space-y-2">
                            <h3 className="text-2xl font-black uppercase tracking-tight">Sacar Fundos</h3>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Saldo Disponível: {formatCurrency(balance)}</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Quanto deseja sacar?</Label>
                                <div className="relative">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-light text-zinc-300">R$</span>
                                    <Input
                                        type="number"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        className="h-20 pl-16 pr-6 bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/10 rounded-[24px] text-4xl font-black focus:ring-0"
                                        placeholder="0,00"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Destino</Label>
                                <div className="grid gap-2">
                                    {accounts?.map((acc: any) => (
                                        <button
                                            key={acc.id}
                                            onClick={() => setSelectedAccount(acc)}
                                            className={cn(
                                                "flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                                                selectedAccount?.id === acc.id
                                                    ? "bg-zinc-900 dark:bg-white border-transparent text-white dark:text-black shadow-xl scale-[1.02]"
                                                    : "bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", selectedAccount?.id === acc.id ? "bg-white/20 dark:bg-black/10" : "bg-zinc-100 dark:bg-white/5")}>
                                                    <Landmark className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black uppercase tracking-tight">{acc.holder_name}</p>
                                                    <p className={cn("text-[9px] font-bold mt-0.5 opacity-60", selectedAccount?.id === acc.id ? "text-white dark:text-black" : "text-zinc-500")}>
                                                        {acc.pix_key || `Ag ${acc.agency} Cc ${acc.account_number}`}
                                                    </p>
                                                </div>
                                            </div>
                                            {selectedAccount?.id === acc.id && <Check className="w-4 h-4" />}
                                        </button>
                                    ))}
                                    {accounts?.length === 0 && (
                                        <p className="text-[10px] text-zinc-400 text-center py-4 italic">Nenhuma conta cadastrada.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={handleContinue}
                            disabled={!amount || !selectedAccount}
                            className="w-full h-16 rounded-[24px] bg-zinc-900 dark:bg-white text-white dark:text-black font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl hover:scale-[1.02] transition-all"
                        >
                            Continuar <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="pin"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-8 text-center"
                    >
                        <div className="w-20 h-20 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-[28px] flex items-center justify-center mx-auto shadow-2xl mb-6">
                            <Lock className="w-8 h-8" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black uppercase tracking-tight">Assinatura Digital</h3>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Insira seu PIN de segurança para confirmar</p>
                        </div>

                        <div className="max-w-[200px] mx-auto">
                            <Input
                                type="password"
                                maxLength={6}
                                value={pin}
                                onChange={e => setPin(e.target.value)}
                                className="h-16 bg-zinc-100 dark:bg-white/[0.05] border-transparent rounded-[20px] text-3xl font-black text-center tracking-[0.5em] focus:ring-0"
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button variant="ghost" onClick={() => setShowPin(false)} className="flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest">Voltar</Button>
                            <Button
                                onClick={handleConfirm}
                                disabled={isProcessing || pin.length < 4}
                                className="flex-1 h-14 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black font-black uppercase text-[10px] tracking-widest shadow-xl"
                            >
                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar"}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};