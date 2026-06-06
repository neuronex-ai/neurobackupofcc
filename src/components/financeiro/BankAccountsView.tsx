"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Landmark, Loader2, LockKeyhole, Pencil, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFinancialAccount } from "@/hooks/use-financial-account";

const digits = (value: string) => value.replace(/\D/g, "");

export const BankAccountsView = () => {
    const { account, isLoading, updateAccount, refetch } = useFinancialAccount();
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({
        holderName: "",
        cpfCnpj: "",
        bankCode: "",
        agency: "",
        account: "",
        digit: "",
    });

    useEffect(() => {
        if (!account) return;
        setForm({
            holderName: account.bank_holder_name || account.holder_name || "",
            cpfCnpj: account.bank_holder_cpf_cnpj || account.cpf_cnpj || "",
            bankCode: account.bank_code || account.bank_name || "",
            agency: account.bank_agency || "",
            account: account.bank_account || "",
            digit: account.bank_account_digit || "",
        });
    }, [account]);

    const hasStoredAccount = Boolean(account?.bank_account || account?.bank_account_last4);
    const hasCompleteBankAccount = Boolean(
        account?.bank_code && account?.bank_agency && hasStoredAccount
    );

    const maskedAccount = useMemo(() => {
        const last4 = account?.bank_account_last4 || `${form.account}${form.digit}`.slice(-4);
        return last4 ? `•••• ${last4}` : "Não informada";
    }, [account?.bank_account_last4, form.account, form.digit]);

    const setField = (field: keyof typeof form, value: string) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const handleSave = async () => {
        if (!form.holderName.trim() || digits(form.bankCode).length !== 3 || !digits(form.agency) || !digits(form.account)) {
            toast.error("Confira titular, banco, agência e conta.");
            return;
        }

        try {
            const result = await updateAccount.mutateAsync({
                bank_code: digits(form.bankCode),
                agency: digits(form.agency),
                account: digits(form.account),
                account_digit: digits(form.digit),
                owner_name: form.holderName.trim(),
                cpfCnpj: digits(form.cpfCnpj),
                account_type: "CONTA_CORRENTE",
            });
            await refetch();
            setIsEditing(false);
            if (result?.sync_status === "deferred") {
                toast.warning("Conta salva no NeuroNex. A sincronização com a Asaas seguirá em segundo plano.");
            } else {
                toast.success("Conta de repasse atualizada.");
            }
        } catch (error: any) {
            toast.error(error?.message || "Não foi possível atualizar a conta.");
        }
    };

    if (isLoading) {
        return <div className="flex min-h-[280px] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-zinc-400" /></div>;
    }

    return (
        <div className="mx-auto max-w-4xl space-y-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.26em] text-zinc-400">Destino de repasse</p>
                    <h3 className="mt-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-white">Conta bancária</h3>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Dados sincronizados com o cadastro da sua subconta Asaas.</p>
                </div>
                <Button
                    onClick={() => setIsEditing((value) => !value)}
                    variant="outline"
                    className="h-11 rounded-xl border-black/10 bg-white/70 px-5 text-[10px] font-black uppercase tracking-[0.18em] backdrop-blur-xl transition-all active:scale-[0.98] dark:border-white/10 dark:bg-white/[0.04]"
                >
                    {isEditing ? <X className="mr-2 h-4 w-4" /> : <Pencil className="mr-2 h-4 w-4" />}
                    {isEditing ? "Cancelar" : "Atualizar dados"}
                </Button>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-[32px] border border-black/[0.07] bg-white/[0.82] p-6 shadow-[0_28px_80px_-52px_rgba(0,0,0,0.55)] backdrop-blur-3xl sm:p-8 dark:border-white/[0.08] dark:bg-white/[0.035]"
            >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(255,255,255,.75),transparent_38%),radial-gradient(circle_at_90%_100%,rgba(0,0,0,.05),transparent_38%)] dark:bg-[radial-gradient(circle_at_10%_0%,rgba(255,255,255,.08),transparent_42%)]" />

                {!isEditing ? (
                    <div className="relative z-10 flex min-h-[210px] flex-col justify-between gap-10">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-black/[0.06] bg-black/[0.03] dark:border-white/[0.08] dark:bg-white/[0.05]">
                                <Landmark className="h-6 w-6" />
                            </div>
                            <div className="flex items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/[0.06] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">
                                {hasCompleteBankAccount ? <CheckCircle2 className="h-3.5 w-3.5" /> : <LockKeyhole className="h-3.5 w-3.5" />}
                                {hasCompleteBankAccount ? "Cadastrada" : hasStoredAccount ? "Completar dados" : "Pendente"}
                            </div>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-3">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Titular</p>
                                <p className="mt-2 truncate text-sm font-black text-zinc-950 dark:text-white">{form.holderName || "Não informado"}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Banco / agência</p>
                                <p className="mt-2 text-sm font-black text-zinc-950 dark:text-white">{form.bankCode || "—"} / {form.agency || "—"}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Conta</p>
                                <p className="mt-2 font-mono text-lg font-black tracking-[0.12em] text-zinc-950 dark:text-white">{maskedAccount}</p>
                            </div>
                        </div>

                        {hasStoredAccount && !hasCompleteBankAccount ? (
                            <button
                                type="button"
                                onClick={() => setIsEditing(true)}
                                className="flex w-full items-center gap-3 rounded-2xl border border-amber-500/15 bg-amber-500/[0.06] px-4 py-3 text-left transition-colors hover:bg-amber-500/[0.1] dark:border-amber-300/10"
                            >
                                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                    A conta {maskedAccount} está registrada. Complete banco e agência para habilitar repasses.
                                </span>
                            </button>
                        ) : null}
                    </div>
                ) : (
                    <div className="relative z-10 space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Titular"><Input value={form.holderName} onChange={(e) => setField("holderName", e.target.value)} /></Field>
                            <Field label="CPF/CNPJ do titular"><Input value={form.cpfCnpj} onChange={(e) => setField("cpfCnpj", e.target.value)} /></Field>
                            <Field label="Código do banco"><Input value={form.bankCode} maxLength={3} onChange={(e) => setField("bankCode", digits(e.target.value).slice(0, 3))} /></Field>
                            <Field label="Agência"><Input value={form.agency} onChange={(e) => setField("agency", digits(e.target.value))} /></Field>
                            <Field label="Conta"><Input value={form.account} onChange={(e) => setField("account", digits(e.target.value))} /></Field>
                            <Field label="Dígito"><Input value={form.digit} maxLength={1} onChange={(e) => setField("digit", digits(e.target.value).slice(0, 1))} /></Field>
                        </div>
                        <Button
                            onClick={handleSave}
                            disabled={updateAccount.isPending}
                            className="h-14 w-full rounded-2xl bg-zinc-950 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] dark:bg-white dark:text-zinc-950"
                        >
                            {updateAccount.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ShieldCheck className="mr-2 h-4 w-4" /> Salvar e sincronizar</>}
                        </Button>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="space-y-2">
        <Label className="ml-1 text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">{label}</Label>
        <div className="[&_input]:h-12 [&_input]:rounded-xl [&_input]:border-black/10 [&_input]:bg-white/70 [&_input]:font-bold dark:[&_input]:border-white/10 dark:[&_input]:bg-white/[0.04]">
            {children}
        </div>
    </div>
);
