/**
 * ─── PixGerarQrCode — Gerar QR Code Pix ─────────────────────────
 * Generates a PIX QR Code (immediate charge) via NeuroFinance / Asaas.
 * Uses asaas-create-payment Edge Function.
 * ─────────────────────────────────────────────────────────────────
 */

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
    QrCode,
    Loader2,
    Copy,
    DollarSign,
    FileText,
    User,
    RefreshCw,
    Plus,
    AlertCircle,
    ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNeuroFinancePix } from "@/hooks/use-neurofinance-pix";
import { usePatients } from "@/hooks/use-patients";
import { NewPatientModal } from "@/components/patients/NewPatientModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDocumentInput, formatMoneyInput, moneyInputToNumber, onlyDigits } from "@/lib/financial-input";
import { toast } from "sonner";

export function PixGerarQrCode() {
    const [valor, setValor] = useState("");
    const [descricao, setDescricao] = useState("");
    const [nomeDevedor, setNomeDevedor] = useState("");
    const [cpfDevedor, setCpfDevedor] = useState("");
    const [selectedPatientId, setSelectedPatientId] = useState("manual");
    const [expiracao, setExpiracao] = useState("3600");
    const [generatedCharge, setGeneratedCharge] = useState<any>(null);
    const [step, setStep] = useState<"form" | "result">("form");
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const { createCharge } = useNeuroFinancePix();
    const { data: patients = [], isLoading: isLoadingPatients } = usePatients();
    const navigate = useNavigate();

    const selectedPatient = useMemo(
        () => patients.find((patient) => patient.id === selectedPatientId),
        [patients, selectedPatientId]
    );

    const selectedPatientPayer = useMemo(() => {
        if (!selectedPatient) return null;

        const usesExternalPayer = selectedPatient.payer_type === "other";
        const payerName = usesExternalPayer
            ? selectedPatient.payer_name || selectedPatient.name
            : selectedPatient.name;
        const payerDocument = onlyDigits(
            (usesExternalPayer ? selectedPatient.payer_cpf : selectedPatient.cpf) ||
            selectedPatient.cpf ||
            selectedPatient.payer_cpf ||
            "",
            14
        );

        return {
            name: payerName,
            document: payerDocument,
        };
    }, [selectedPatient]);

    const manualName = nomeDevedor.trim();
    const manualDocument = onlyDigits(cpfDevedor, 14);
    const hasSelectedPatient = Boolean(selectedPatient);
    const selectedPatientMissingDocument = Boolean(selectedPatient && !selectedPatientPayer?.document);
    const missingManualName = !hasSelectedPatient && !manualName;
    const missingManualDocument = !hasSelectedPatient && !manualDocument;
    const canGenerate = Boolean(valor) && !createCharge.isPending && (
        hasSelectedPatient
            ? Boolean(selectedPatientPayer?.document)
            : Boolean(manualName && manualDocument)
    );

    const handleGenerate = async () => {
        setSubmitAttempted(true);

        const numericValue = moneyInputToNumber(valor);
        if (numericValue <= 0) {
            toast.error("Informe um valor válido.");
            return;
        }

        const payerName = selectedPatientPayer?.name || manualName;
        const payerDocument = selectedPatientPayer?.document || manualDocument;

        if (!payerName || !payerDocument) {
            toast.error("Informe o nome e CPF/CNPJ do pagador para gerar o QR Code.");
            return;
        }

        try {
            const result = await createCharge.mutateAsync({
                valor: numericValue,
                descricao: descricao || "Cobrança Pix NeuroFinance",
                expiracao: Math.round((parseInt(expiracao) || 3600) / 60),
                patientId: selectedPatient?.id,
                devedor: {
                    nome: payerName,
                    ...(payerDocument.length > 11 ? { cnpj: payerDocument } : { cpf: payerDocument }),
                },
            });

            setGeneratedCharge(result);
            setStep("result");
        } catch {
            // Error handled by mutation
        }
    };

    const handleCopyPixCode = () => {
        const code = generatedCharge?.pix_copy_paste || "";
        if (code) {
            navigator.clipboard.writeText(code);
            toast.success("Pix Copia e Cola copiado!");
        }
    };

    const handleReset = () => {
        setValor("");
        setDescricao("");
        setNomeDevedor("");
        setCpfDevedor("");
        setSelectedPatientId("manual");
        setSubmitAttempted(false);
        setGeneratedCharge(null);
        setStep("form");
    };

    const expiracaoOptions = [
        { value: "1800", label: "30 min" },
        { value: "3600", label: "1 hora" },
        { value: "7200", label: "2 horas" },
        { value: "86400", label: "24 horas" },
    ];

    const requiredPill = (
        <span className="rounded-full border border-zinc-200/60 bg-zinc-100/70 px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.18em] text-zinc-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-500">
            Obrigatório
        </span>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="p-6 rounded-[28px] bg-zinc-900 dark:bg-white border border-zinc-800 dark:border-zinc-200">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 dark:bg-black/5 text-white dark:text-zinc-900 flex items-center justify-center shadow-lg">
                        <QrCode className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-tight text-white dark:text-zinc-900">
                            Gerar QR Code Pix
                        </h3>
                        <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-0.5">
                            Crie um QR Code e receba pagamentos na hora • NeuroFinance API
                        </p>
                    </div>
                    <div className="ml-auto px-3 py-1 rounded-full bg-white/10 dark:bg-black/5 text-[8px] font-black uppercase tracking-widest text-white dark:text-zinc-900">
                        Produção
                    </div>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {step === "form" && (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        {/* Valor */}
                        <div className="p-5 rounded-[24px] bg-white/60 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/[0.06]">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3 block">
                                <DollarSign className="w-3 h-3 inline mr-1.5 -mt-0.5" />
                                Valor da cobrança (R$)
                            </label>
                            <input
                                inputMode="decimal"
                                value={valor}
                                onChange={(e) => setValor(formatMoneyInput(e.target.value))}
                                placeholder="0,00"
                                className="w-full h-16 px-4 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 text-3xl font-black text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900/30 dark:focus:ring-white/30"
                            />
                        </div>

                        {/* Expiração */}
                        <div className="p-5 rounded-[24px] bg-white/60 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/[0.06]">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3 block">
                                Validade do QR Code
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {expiracaoOptions.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setExpiracao(opt.value)}
                                        className={cn(
                                            "h-10 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all",
                                            expiracao === opt.value
                                                ? "bg-zinc-900 dark:bg-white text-white dark:text-black shadow-lg"
                                                : "bg-zinc-100 dark:bg-white/5 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-white/10"
                                        )}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Pagador */}
                        <div className="p-5 rounded-[24px] bg-white/60 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/[0.06] space-y-4">
                            <div className="flex items-center justify-between gap-3">
                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 block">
                                    <User className="w-3 h-3 inline mr-1.5 -mt-0.5" />
                                    Pagador
                                </label>
                                <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-600">
                                    Selecione paciente ou preencha manualmente
                                </span>
                            </div>

                            <div className="grid grid-cols-[minmax(0,1fr)_48px] gap-3">
                                <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                                    <SelectTrigger className="h-11 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border-zinc-200 dark:border-white/10 text-xs font-bold text-zinc-700 dark:text-zinc-200 focus:ring-zinc-900/20 dark:focus:ring-white/20">
                                        <SelectValue placeholder={isLoadingPatients ? "Carregando pacientes..." : "Selecionar paciente cadastrado"} />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-zinc-200 dark:border-white/10 bg-white/95 dark:bg-zinc-950/95 text-zinc-900 dark:text-zinc-100">
                                        <SelectItem value="manual" className="rounded-xl text-xs font-bold">
                                            Preenchimento manual
                                        </SelectItem>
                                        {patients.map((patient) => (
                                            <SelectItem key={patient.id} value={patient.id} className="rounded-xl text-xs font-bold">
                                                {patient.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <NewPatientModal>
                                    <button
                                        type="button"
                                        title="Adicionar novo paciente"
                                        className="h-11 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shadow-lg hover:opacity-90 transition-all active:scale-95"
                                    >
                                        <Plus className="w-4 h-4 stroke-[3]" />
                                    </button>
                                </NewPatientModal>
                            </div>

                            {selectedPatient && !selectedPatientMissingDocument && (
                                <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.04] px-4 py-3 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                                    Usando os dados fiscais cadastrados em {selectedPatient.name}.
                                </div>
                            )}

                            {selectedPatientMissingDocument && (
                                <div className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.06] px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div className="flex items-start gap-2 text-[10px] font-bold leading-relaxed text-amber-700 dark:text-amber-300">
                                        <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                        <span>Para gerar a cobrança, este paciente precisa ter CPF ou CNPJ cadastrado no prontuário.</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/pacientes/${selectedPatient.id}?edit=1`)}
                                        className="h-8 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-[8px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300 transition-colors flex items-center justify-center gap-2"
                                    >
                                        Editar prontuário
                                        <ExternalLink className="w-3 h-3" />
                                    </button>
                                </div>
                            )}

                            {!selectedPatient && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <div className="flex items-center justify-between mb-2 px-1">
                                            <span className="text-[8px] font-black uppercase tracking-[0.18em] text-zinc-400">Nome completo</span>
                                            {requiredPill}
                                        </div>
                                        <input
                                            value={nomeDevedor}
                                            onChange={(e) => setNomeDevedor(e.target.value)}
                                            placeholder="Nome completo"
                                            className={cn(
                                                "h-10 w-full px-3 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/30 dark:focus:ring-white/30",
                                                submitAttempted && missingManualName && "border-amber-400/50 dark:border-amber-400/40"
                                            )}
                                        />
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-2 px-1">
                                            <span className="text-[8px] font-black uppercase tracking-[0.18em] text-zinc-400">CPF/CNPJ</span>
                                            {requiredPill}
                                        </div>
                                        <input
                                            value={cpfDevedor}
                                            onChange={(e) => setCpfDevedor(formatDocumentInput(e.target.value))}
                                            placeholder="CPF ou CNPJ"
                                            className={cn(
                                                "h-10 w-full px-3 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/30 dark:focus:ring-white/30",
                                                submitAttempted && missingManualDocument && "border-amber-400/50 dark:border-amber-400/40"
                                            )}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Descrição */}
                        <div className="p-5 rounded-[24px] bg-white/60 dark:bg-white/[0.02] border border-zinc-200/50 dark:border-white/[0.06]">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3 block">
                                <FileText className="w-3 h-3 inline mr-1.5 -mt-0.5" />
                                Descrição (Opcional)
                            </label>
                            <input
                                value={descricao}
                                onChange={(e) => setDescricao(e.target.value)}
                                placeholder="Ex: Pagamento consulta Dr. João"
                                className="w-full h-10 px-3 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/30 dark:focus:ring-white/30"
                            />
                        </div>

                        {/* Generate */}
                        <button
                            onClick={handleGenerate}
                            disabled={!canGenerate}
                            className={cn(
                                "w-full h-14 rounded-2xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300",
                                canGenerate
                                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 shadow-2xl"
                                    : "bg-zinc-100 dark:bg-white/5 text-zinc-400 cursor-not-allowed"
                            )}
                        >
                            {createCharge.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <QrCode className="w-4 h-4" />
                                    Gerar QR Code
                                </>
                            )}
                        </button>
                    </motion.div>
                )}

                {step === "result" && generatedCharge && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-5"
                    >
                        {/* QR Code Display */}
                        <div className="p-8 rounded-[28px] bg-white dark:bg-white/[0.03] border border-zinc-200/50 dark:border-white/[0.06] flex flex-col items-center text-center">
                            <div className="w-52 h-52 rounded-[32px] bg-white p-4 shadow-2xl flex items-center justify-center mb-6 border border-zinc-100 dark:border-white/5 relative group transition-transform hover:scale-[1.02] duration-500">
                                {generatedCharge?.pix_qr_code ? (
                                    <img
                                        src={`data:image/png;base64,${generatedCharge.pix_qr_code}`}
                                        alt="PIX QR Code"
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <div className="text-center">
                                        <QrCode className="w-16 h-16 text-zinc-900 mx-auto mb-2 opacity-20" />
                                        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">
                                            QR Code Indisponível
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="text-3xl font-black text-zinc-900 dark:text-white mb-1">
                                {moneyInputToNumber(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </div>

                            {generatedCharge?.payment_id && (
                                <p className="text-[9px] font-mono text-zinc-400 mt-2">
                                    ID: {generatedCharge.payment_id}
                                </p>
                            )}

                            {generatedCharge?.status && (
                                <span className="mt-3 px-3 py-1 rounded-full bg-zinc-100 dark:bg-white/10 text-[8px] font-black uppercase tracking-widest text-zinc-900 dark:text-white">
                                    {generatedCharge.status}
                                </span>
                            )}
                        </div>

                        {/* Copy & Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleCopyPixCode}
                                disabled={!generatedCharge?.pix_copy_paste}
                                className="flex-1 h-12 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                            >
                                <Copy className="w-3.5 h-3.5" />
                                Copiar Pix Copia e Cola
                            </button>
                            <button
                                onClick={handleReset}
                                className="h-12 px-5 rounded-2xl bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-zinc-200 dark:hover:bg-white/10 transition-all"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Novo
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
