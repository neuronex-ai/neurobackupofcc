/**
 * ─── PixGerarQrCode — Gerar QR Code Pix ─────────────────────────
 * Generates a PIX QR Code charge via NeuroFinance / Asaas.
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
} from "lucide-react";
import { useNeuroFinancePix } from "@/hooks/use-neurofinance-pix";
import { usePatients } from "@/hooks/use-patients";
import { NewPatientModal } from "@/components/patients/NewPatientModal";
import { EditPatientModal } from "@/components/patients/EditPatientModal";
import { formatDocumentInput, formatMoneyInput, moneyInputToNumber, onlyDigits } from "@/lib/financial-input";
import { toast } from "sonner";
import type { Patient } from "@/types";

function getPatientBillingName(patient?: Patient | null) {
    if (!patient) return "";
    if (patient.payer_type === "other" && patient.payer_name?.trim()) return patient.payer_name.trim();
    return patient.name || "";
}

function getPatientDocument(patient?: Patient | null) {
    if (!patient) return "";
    const dynamicPatient = patient as Patient & { cnpj?: string | null; cpf_cnpj?: string | null };
    const payerDocument = patient.payer_type === "other" ? patient.payer_cpf : null;
    return payerDocument || patient.cpf || patient.payer_cpf || dynamicPatient.cnpj || dynamicPatient.cpf_cnpj || "";
}

export function PixGerarQrCode() {
    const [valor, setValor] = useState("");
    const [descricao, setDescricao] = useState("");
    const [nomeDevedor, setNomeDevedor] = useState("");
    const [cpfDevedor, setCpfDevedor] = useState("");
    const [selectedPatientId, setSelectedPatientId] = useState("");
    const [expiracao, setExpiracao] = useState("3600");
    const [generatedCharge, setGeneratedCharge] = useState<any>(null);
    const [step, setStep] = useState<"form" | "result">("form");
    const { createCharge } = useNeuroFinancePix();
    const { data: patients = [], isLoading: patientsLoading } = usePatients();

    const selectedPatient = useMemo(
        () => patients.find((patient) => patient.id === selectedPatientId) || null,
        [patients, selectedPatientId]
    );

    const selectedPatientDocument = getPatientDocument(selectedPatient);
    const selectedPatientDocumentDigits = onlyDigits(selectedPatientDocument, 14);
    const selectedPatientMissingDocument = Boolean(selectedPatient && !selectedPatientDocumentDigits);

    const handlePatientSelect = (patientId: string) => {
        setSelectedPatientId(patientId);

        if (!patientId) return;

        const patient = patients.find((item) => item.id === patientId);
        if (!patient) return;

        setNomeDevedor(getPatientBillingName(patient));
        setCpfDevedor(formatDocumentInput(getPatientDocument(patient)));
    };

    const handleGenerate = async () => {
        const numericValue = moneyInputToNumber(valor);
        if (numericValue <= 0) {
            toast.error("Informe um valor válido.");
            return;
        }

        const payerName = nomeDevedor.trim();
        const payerDocument = onlyDigits(cpfDevedor, 14);

        if (!payerName) {
            toast.error("Informe o nome do pagador.");
            return;
        }

        if (![11, 14].includes(payerDocument.length)) {
            toast.error("Informe um CPF ou CNPJ válido para o pagador.");
            return;
        }

        if (selectedPatientMissingDocument) {
            toast.error("Atualize o CPF ou CNPJ no prontuário do paciente antes de gerar a cobrança.");
            return;
        }

        try {
            const devedor = {
                nome: payerName,
                ...(payerDocument.length > 11 ? { cnpj: payerDocument } : { cpf: payerDocument }),
            };

            const result = await createCharge.mutateAsync({
                valor: numericValue,
                descricao: descricao || "Cobrança Pix NeuroFinance",
                expiracao: Math.round((parseInt(expiracao) || 3600) / 60),
                devedor,
                patientId: selectedPatient?.id,
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
        setSelectedPatientId("");
        setGeneratedCharge(null);
        setStep("form");
    };

    const expiracaoOptions = [
        { value: "1800", label: "30 min" },
        { value: "3600", label: "1 hora" },
        { value: "7200", label: "2 horas" },
        { value: "86400", label: "24 horas" },
    ];

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
                            <div>
                                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3 block">
                                    <User className="w-3 h-3 inline mr-1.5 -mt-0.5" />
                                    Paciente cadastrado ou pagador externo
                                </label>
                                <div className="grid grid-cols-[1fr_auto] gap-3">
                                    <select
                                        value={selectedPatientId}
                                        onChange={(event) => handlePatientSelect(event.target.value)}
                                        className="h-10 px-3 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/30 dark:focus:ring-white/30"
                                    >
                                        <option value="">
                                            {patientsLoading ? "Carregando pacientes..." : "Preencher manualmente / pessoa externa"}
                                        </option>
                                        {patients.map((patient) => (
                                            <option key={patient.id} value={patient.id}>
                                                {patient.name}
                                            </option>
                                        ))}
                                    </select>

                                    <NewPatientModal>
                                        <button
                                            type="button"
                                            className="h-10 w-10 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
                                            aria-label="Adicionar novo prontuário"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </NewPatientModal>
                                </div>
                            </div>

                            {selectedPatient && (
                                <div className={cn(
                                    "rounded-2xl border px-4 py-3 flex flex-col gap-3 text-[10px] font-bold uppercase tracking-wider",
                                    selectedPatientMissingDocument
                                        ? "bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-300"
                                        : "bg-zinc-900/[0.03] dark:bg-white/[0.04] border-zinc-200/70 dark:border-white/10 text-zinc-500 dark:text-zinc-400"
                                )}>
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                        <span>
                                            Para gerar a cobrança por paciente cadastrado, é obrigatório que o CPF ou CNPJ esteja salvo no prontuário.
                                        </span>
                                    </div>

                                    {selectedPatientMissingDocument && (
                                        <div>
                                            <EditPatientModal patient={selectedPatient}>
                                                <button
                                                    type="button"
                                                    className="h-9 px-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[9px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
                                                >
                                                    Editar prontuário e preencher CPF/CNPJ
                                                </button>
                                            </EditPatientModal>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                            Nome completo
                                        </label>
                                        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 bg-zinc-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                                            Obrigatório
                                        </span>
                                    </div>
                                    <input
                                        value={nomeDevedor}
                                        onChange={(e) => setNomeDevedor(e.target.value)}
                                        placeholder="Nome completo"
                                        className="w-full h-10 px-3 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/30 dark:focus:ring-white/30"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                            CPF/CNPJ
                                        </label>
                                        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 bg-zinc-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                                            Obrigatório
                                        </span>
                                    </div>
                                    <input
                                        value={cpfDevedor}
                                        onChange={(e) => setCpfDevedor(formatDocumentInput(e.target.value))}
                                        placeholder="CPF ou CNPJ"
                                        className="w-full h-10 px-3 rounded-xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/30 dark:focus:ring-white/30"
                                    />
                                </div>
                            </div>
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
                            disabled={createCharge.isPending || !valor}
                            className={cn(
                                "w-full h-14 rounded-2xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300",
                                valor
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
