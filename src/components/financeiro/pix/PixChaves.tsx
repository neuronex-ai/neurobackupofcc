import { Copy, Hash, Key, Loader2, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { usePixKeys } from "@/hooks/use-neurofinance-pix";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";

export function PixChaves() {
    const { data: keys = [], isLoading, error, createKey, deleteKey } = usePixKeys();

    const copy = async (value: string) => {
        await navigator.clipboard.writeText(value);
        toast.success("Chave Pix copiada.");
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-[24px] border border-black/[0.06] bg-white/70 p-5 backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.08] dark:bg-white/[0.025]">
                <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-xl dark:bg-white dark:text-zinc-950">
                        <Key className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-tight text-zinc-950 dark:text-white">Minhas chaves Pix</h3>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">Chaves para receber pela sua conta NeuroFinance</p>
                    </div>
                </div>
                <Button
                    onClick={() => createKey.mutate()}
                    disabled={createKey.isPending}
                    className="h-11 rounded-xl bg-zinc-950 px-5 text-[9px] font-black uppercase tracking-[0.16em] text-white active:scale-[0.98] dark:bg-white dark:text-zinc-950"
                >
                    {createKey.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="mr-2 h-4 w-4" /> Criar chave aleatória</>}
                </Button>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-black/[0.06] bg-black/[0.025] p-4 dark:border-white/[0.07] dark:bg-white/[0.025]">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-[10px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                    Ao criar uma chave, você autoriza o cadastro de uma chave aleatória na sua conta. A conta precisa estar aprovada e com validação de segurança concluída.
                </p>
            </div>

            {isLoading ? (
                <div className="flex min-h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>
            ) : error ? (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-5 text-sm text-amber-700 dark:text-amber-300">
                    {getUserFacingErrorMessage(error, "load")}
                </div>
            ) : keys.length === 0 ? (
                <div className="flex min-h-52 flex-col items-center justify-center rounded-[24px] border border-dashed border-black/10 bg-black/[0.015] text-center dark:border-white/10 dark:bg-white/[0.015]">
                    <Hash className="mb-4 h-9 w-9 text-zinc-300 dark:text-zinc-700" />
                    <p className="text-sm font-bold text-zinc-600 dark:text-zinc-300">Nenhuma chave cadastrada</p>
                    <p className="mt-1 text-[10px] text-zinc-400">Crie uma chave aleatória para receber Pix com mais agilidade.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {keys.map((item: any, index: number) => {
                        const value = item.key || item.addressKey || item.value || item.id;
                        return (
                            <motion.div
                                key={item.id || value}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.04 }}
                                className="flex items-center gap-4 rounded-[20px] border border-black/[0.06] bg-white/75 p-4 shadow-sm backdrop-blur-xl dark:border-white/[0.07] dark:bg-white/[0.025]"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"><Hash className="h-4 w-4" /></div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-400">{item.type || "EVP"} · {item.status || "Ativa"}</p>
                                    <p className="mt-1 truncate font-mono text-xs font-bold text-zinc-950 dark:text-white">{value}</p>
                                </div>
                                <button onClick={() => copy(value)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/[0.04] transition-transform active:scale-90 dark:bg-white/[0.05]" title="Copiar chave"><Copy className="h-4 w-4" /></button>
                                <button onClick={() => deleteKey.mutate(item.provider_id || item.id || value)} disabled={deleteKey.isPending} className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/[0.06] text-rose-500 transition-transform active:scale-90 disabled:opacity-40" title="Excluir chave"><Trash2 className="h-4 w-4" /></button>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
