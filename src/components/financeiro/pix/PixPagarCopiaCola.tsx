/**
 * ─── PixPagarCopiaCola — Pagar Pix Copia e Cola ─────────────────
 * Allows users to paste a PIX copy-paste code and process payment.
 * Connected to NeuroFinance / Asaas BaaS API.
 * ─────────────────────────────────────────────────────────────────
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
    QrCode,
    ClipboardPaste,
    Send,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    Eye,
    EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { useNeuroFinancePix } from "@/hooks/use-neurofinance-pix";

export function PixPagarCopiaCola() {
    const [pixCode, setPixCode] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [decodedInfo, setDecodedInfo] = useState<any>(null);
    const [showValue, setShowValue] = useState(true);
    const [step, setStep] = useState<"input" | "confirm" | "success">("input");
    const { sendPix } = useNeuroFinancePix();

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setPixCode(text);
            toast.success("Código colado com sucesso!");
        } catch {
            toast.error("Não foi possível acessar a área de transferência.");
        }
    };

    const handleDecodeAndPay = async () => {
        if (!pixCode.trim()) {
            toast.error("Cole o código PIX Copia e Cola.");
            return;
        }

        setIsProcessing(true);
        try {
            // In sandbox, we simulate decoding the PIX payload
            // In production, this would call the Asaas API to decode and process
            const mockDecoded = {
                chave: "sandbox@neurofinance.com",
                valor: "150.00",
                nome: "Empresa Sandbox LTDA",
                cidade: "São Paulo",
                txid: pixCode.substring(0, 25) || "sandbox-txid",
            };

            setDecodedInfo(mockDecoded);
            setStep("confirm");
        } catch (error: any) {
            toast.error(`Erro ao processar: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirmPayment = async () => {
        if (!decodedInfo) return;

        setIsProcessing(true);
        try {
            await sendPix.mutateAsync({
                valor: parseFloat(decodedInfo.valor),
                pixKey: decodedInfo.chave,
                descricao: `Pagamento Pix: ${decodedInfo.nome}`,
                type: 'pay'
            });

            setStep("success");
            toast.success("Pagamento Pix processado com sucesso!");
        } catch (error: any) {
            // Error handled by mutation onError
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReset = () => {
        setPixCode("");
        setDecodedInfo(null);
        setStep("input");
    };

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <div className="p-6 rounded-[28px] bg-zinc-900 dark:bg-white border border-zinc-800 dark:border-zinc-200">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 dark:bg-black/5 text-white dark:text-zinc-900 flex items-center justify-center shadow-lg">
                        <QrCode className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-tight text-white dark:text-zinc-900">
                            Pagar Pix Copia e Cola
                        </h3>
                        <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-0.5">
                            Cole o código e pague instantaneamente • Grátis
                        </p>
                    </div>
                    <div className="ml-auto px-3 py-1 rounded-full bg-white/10 dark:bg-black/5 text-[8px] font-black uppercase tracking-widest text-white dark:text-zinc-900">
                        Sandbox
                    </div>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {step === "input" && (
                    <motion.div
                        key="input"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        {/* Input Area */}
                        <div className="p-6 rounded-[24px] bg-white/60 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/[0.06] backdrop-blur-xl">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-3 block">
                                Cole o código Pix Copia e Cola
                            </label>
                            <div className="relative">
                                <textarea
                                    value={pixCode}
                                    onChange={(e) => setPixCode(e.target.value)}
                                    placeholder="00020126580014br.gov.bcb.pix..."
                                    className="w-full h-32 p-4 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 text-sm font-mono text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 resize-none focus:outline-none focus:ring-2 focus:ring-zinc-900/30 dark:focus:ring-white/30 transition-all"
                                />
                                <button
                                    onClick={handlePaste}
                                    className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                                >
                                    <ClipboardPaste className="w-3 h-3" />
                                    Colar
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            onClick={handleDecodeAndPay}
                            disabled={isProcessing || !pixCode.trim()}
                            className={cn(
                                "w-full h-14 rounded-2xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300",
                                pixCode.trim()
                                    ? "bg-zinc-900 dark:bg-white text-white dark:text-black hover:opacity-90 shadow-2xl"
                                    : "bg-zinc-100 dark:bg-white/5 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                            )}
                        >
                            {isProcessing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Processar Pagamento
                                </>
                            )}
                        </button>
                    </motion.div>
                )}

                {step === "confirm" && decodedInfo && (
                    <motion.div
                        key="confirm"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        <div className="p-6 rounded-[24px] bg-white/60 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/[0.06] backdrop-blur-xl space-y-5">
                            <div className="flex items-center justify-between">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    Confirme os dados do pagamento
                                </p>
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                            </div>

                            <div className="space-y-3">
                                {[
                                    { label: "Beneficiário", value: decodedInfo.nome },
                                    { label: "Chave Pix", value: decodedInfo.chave },
                                    { label: "Cidade", value: decodedInfo.cidade },
                                    { label: "Identificador", value: decodedInfo.txid },
                                ].map((item) => (
                                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-white/5 last:border-0">
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">{item.label}</span>
                                        <span className="text-xs font-bold text-zinc-900 dark:text-white">{item.value}</span>
                                    </div>
                                ))}
                                <div className="flex items-center justify-between py-3 bg-zinc-50 dark:bg-white/[0.03] rounded-xl px-4 -mx-1">
                                    <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Valor</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-black text-zinc-900 dark:text-white">
                                            {showValue ? `R$ ${decodedInfo.valor}` : "R$ •••••"}
                                        </span>
                                        <button onClick={() => setShowValue(!showValue)} className="text-zinc-400 hover:text-zinc-600 transition-colors">
                                            {showValue ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleReset}
                                className="flex-1 h-12 rounded-2xl bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 font-black text-[10px] uppercase tracking-wider hover:bg-zinc-200 dark:hover:bg-white/10 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmPayment}
                                disabled={isProcessing}
                                className="flex-[2] h-12 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg"
                            >
                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar Pagamento"}
                            </button>
                        </div>
                    </motion.div>
                )}

                {step === "success" && (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-12 text-center"
                    >
                        <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-white/10 flex items-center justify-center mb-6">
                            <CheckCircle2 className="w-10 h-10 text-zinc-900 dark:text-white" />
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
                            Pagamento Realizado
                        </h3>
                        <p className="text-sm text-zinc-500 mt-2 max-w-sm">
                            Seu pagamento PIX foi processado com sucesso no ambiente sandbox.
                        </p>
                        <button
                            onClick={handleReset}
                            className="mt-8 px-8 h-12 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black font-black text-[10px] uppercase tracking-wider hover:opacity-90 transition-opacity"
                        >
                            Novo Pagamento
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
