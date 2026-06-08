"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Check, KeyRound, Landmark, Loader2, Lock, Send } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { useNeuroFinanceBalance } from "@/hooks/use-neurofinance-balance";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useRequestPayout, type RequestPayoutParams } from "@/hooks/use-neurofinance-payouts";
import { useFinancialAccount } from "@/hooks/use-financial-account";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";

type DestinationMode = "saved_bank" | "pix_key";

const parseMoneyToCents = (value: string) => {
    const normalized = value.replace(/\./g, "").replace(",", ".");
    const numeric = Number(normalized);
    return Number.isFinite(numeric) ? Math.round(numeric * 100) : 0;
};

const normalizeAccountType = (value?: string | null): "CONTA_CORRENTE" | "CONTA_POUPANCA" =>
    String(value || "").toUpperCase().includes("POUP") ? "CONTA_POUPANCA" : "CONTA_CORRENTE";

export const BankTransferView = () => {
    const { data: balanceData } = useNeuroFinanceBalance();
    const { account } = useFinancialAccount();
    const { mutateAsync: requestPayout } = useRequestPayout();
    const balance = balanceData?.balance || 0;

    const [amount, setAmount] = useState("");
    const [mode, setMode] = useState<DestinationMode>("saved_bank");
    const [pixKey, setPixKey] = useState("");
    const [showPin, setShowPin] = useState(false);
    const [pin, setPin] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    const savedBankDestination = useMemo(() => {
        if (!account?.bank_code || !account?.bank_agency || !account?.bank_account) return null;
        const holder = account.bank_holder_name || account.holder_name || "Conta de repasse";
        const accountDisplay = `${account.bank_account || ""}${account.bank_account_digit || ""}`;
        return {
            type: "saved_bank" as const,
            bank_code: account.bank_code,
            bank_name: account.bank_name || "Banco cadastrado",
            agency: account.bank_agency,
            account: account.bank_account,
            account_digit: account.bank_account_digit || "",
            account_type: normalizeAccountType(account.bank_account_type),
            holder_name: holder,
            holder_document: account.bank_holder_cpf_cnpj || account.cpf_cnpj || "",
            summary: `${holder} · Ag ${account.bank_agency} Conta ${accountDisplay}`,
        };
    }, [account]);

    const amountInCents = parseMoneyToCents(amount);
    const selectedDestination: RequestPayoutParams["destination"] | null = mode === "saved_bank"
        ? savedBankDestination
        : {
            type: "pix_key",
            pix_key: pixKey.trim(),
            summary: pixKey.trim(),
        };

    const canContinue = amountInCents > 0 && amountInCents <= balance && Boolean(
        mode === "saved_bank" ? savedBankDestination : pixKey.trim().length >= 5
    );

    const handleContinue = () => {
        if (amountInCents <= 0) return toast.error("Digite um valor válido.");
        if (amountInCents > balance) return toast.error("Saldo insuficiente para este saque.");
        if (!selectedDestination) return toast.error("Escolha um destino para o saque.");
        setShowPin(true);
    };

    const handleConfirm = async () => {
        if (pin.length !== 6 || !selectedDestination) return;
        setIsProcessing(true);
        try {
            const { data, error } = await supabase.functions.invoke("financial-pin", {
                body: { action: "verify", pin },
            });

            if (error) throw error;
            if (data?.error || !data?.isValid) {
                toast.error("PIN incorreto. Confira os números e tente novamente.");
                setPin("");
                return;
            }

            await requestPayout({
                amount: amountInCents,
                description: mode === "pix_key" ? "Saque por Pix" : "Saque para conta cadastrada",
                destination: selectedDestination,
            });

            setAmount("");
            setPixKey("");
            setShowPin(false);
            setPin("");
        } catch (error) {
            toast.error(getUserFacingErrorMessage(error, "transfer"));
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="mx-auto max-w-xl py-8">
            <AnimatePresence mode="wait">
                {!showPin ? (
                    <motion.div
                        key="setup"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-8"
                    >
                        <div className="space-y-2 text-center">
                            <h3 className="text-2xl font-black uppercase tracking-tight">Sacar fundos</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                Saldo disponível: {formatCurrency(balance)}
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <Label className="ml-1 text-[10px] font-black uppercase tracking-widest">Quanto deseja sacar?</Label>
                                <div className="relative">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-light text-zinc-300">R$</span>
                                    <Input
                                        inputMode="decimal"
                                        value={amount}
                                        onChange={(event) => setAmount(event.target.value)}
                                        className="h-20 rounded-[24px] border-zinc-200 bg-zinc-50 pl-16 pr-6 text-4xl font-black focus:ring-0 dark:border-white/10 dark:bg-white/[0.02]"
                                        placeholder="0,00"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 rounded-[24px] border border-zinc-200/70 bg-white/60 p-1.5 dark:border-white/10 dark:bg-white/[0.02]">
                                {[
                                    { id: "saved_bank" as const, label: "Conta cadastrada", icon: Landmark },
                                    { id: "pix_key" as const, label: "Outra conta por Pix", icon: Send },
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setMode(item.id)}
                                        className={cn(
                                            "flex h-12 items-center justify-center gap-2 rounded-[18px] text-[10px] font-black uppercase tracking-[0.14em] transition-all",
                                            mode === item.id
                                                ? "bg-zinc-950 text-white shadow-lg dark:bg-white dark:text-zinc-950"
                                                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
                                        )}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        {item.label}
                                    </button>
                                ))}
                            </div>

                            {mode === "saved_bank" ? (
                                <div className="space-y-3">
                                    <Label className="ml-1 text-[10px] font-black uppercase tracking-widest">Destino</Label>
                                    {savedBankDestination ? (
                                        <button
                                            type="button"
                                            className="flex w-full items-center justify-between rounded-2xl border border-transparent bg-zinc-950 p-4 text-left text-white shadow-xl dark:bg-white dark:text-black"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 dark:bg-black/10">
                                                    <Landmark className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black uppercase tracking-tight">{savedBankDestination.holder_name}</p>
                                                    <p className="mt-0.5 text-[9px] font-bold opacity-65">
                                                        Ag {savedBankDestination.agency} Conta {savedBankDestination.account}{savedBankDestination.account_digit}
                                                    </p>
                                                </div>
                                            </div>
                                            <Check className="h-4 w-4" />
                                        </button>
                                    ) : (
                                        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-center text-xs font-semibold text-amber-700 dark:text-amber-300">
                                            Cadastre uma conta bancária em Repasse para sacar por TED.
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <Label className="ml-1 text-[10px] font-black uppercase tracking-widest">Chave Pix de destino</Label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                        <Input
                                            value={pixKey}
                                            onChange={(event) => setPixKey(event.target.value)}
                                            placeholder="CPF, e-mail, telefone ou chave aleatória"
                                            className="h-14 rounded-[20px] border-zinc-200 bg-white/80 pl-11 text-sm font-bold dark:border-white/10 dark:bg-white/[0.035]"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <Button
                            onClick={handleContinue}
                            disabled={!canContinue}
                            className="h-16 w-full rounded-[24px] bg-zinc-900 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-2xl transition-all hover:scale-[1.02] dark:bg-white dark:text-black"
                        >
                            Continuar <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="pin"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-8 text-center"
                    >
                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[28px] bg-zinc-900 text-white shadow-2xl dark:bg-white dark:text-black">
                            <Lock className="h-8 w-8" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black uppercase tracking-tight">Assinatura digital</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                Confirme o saque com seu PIN de segurança
                            </p>
                        </div>

                        <div className="mx-auto max-w-[220px]">
                            <Input
                                type="password"
                                inputMode="numeric"
                                maxLength={6}
                                value={pin}
                                onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))}
                                className="h-16 rounded-[20px] border-transparent bg-zinc-100 text-center text-3xl font-black tracking-[0.5em] focus:ring-0 dark:bg-white/[0.05]"
                                autoFocus
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <Button variant="ghost" onClick={() => setShowPin(false)} className="h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                                Voltar
                            </Button>
                            <Button
                                onClick={handleConfirm}
                                disabled={isProcessing || pin.length !== 6}
                                className="h-14 rounded-2xl bg-zinc-900 text-[10px] font-black uppercase tracking-widest text-white shadow-xl dark:bg-white dark:text-black"
                            >
                                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
