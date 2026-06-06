import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Briefcase,
    Building2,
    CheckCircle2,
    Loader2,
    MapPin,
    Pencil,
    ShieldCheck,
    Upload,
    User,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { TermsOfUseModal } from "./TermsOfUseModal";
import { useFinancialAccount } from "@/hooks/use-financial-account";
import { AsaasStamp } from "./AsaasStamp";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { NeuroFinanceCardVisual } from "@/components/landing/Feature3DVisuals";

interface CustomOnboardingFlowProps {
    onComplete: () => void;
    onCancel?: () => void;
    fullScreen?: boolean;
}

type Step =
    | "personal"
    | "business"
    | "banking"
    | "verification"
    | "review"
    | "success";

type PepValue = "none" | "existing";

type FormData = {
    firstName: string;
    lastName: string;
    cpf: string;
    birthDate: string;
    phone: string;
    pep: PepValue;

    cep: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;

    companyType: string;           // Asaas: MEI, LIMITED, INDIVIDUAL, ASSOCIATION
    incomeValue: string;           // Asaas: faturamento mensal
    businessUrl: string;
    businessDescription: string;

    bankCode: string;
    agency: string;
    accountNumber: string;

    tosAccepted: boolean;
};

type UploadedDocIds = {
    front?: string;
    back?: string;
};

const INITIAL_FORM: FormData = {
    firstName: "",
    lastName: "",
    cpf: "",
    birthDate: "",
    phone: "",
    pep: "none",

    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",

    companyType: "",
    incomeValue: "",
    businessUrl: "",
    businessDescription: "Serviços de psicologia e saúde mental",

    bankCode: "",
    agency: "",
    accountNumber: "",

    tosAccepted: false,
};

function onlyDigits(value: string) {
    return value.replace(/\D/g, "");
}

function maskCpf(value: string) {
    return onlyDigits(value)
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
        .slice(0, 14);
}

function maskPhone(value: string) {
    return onlyDigits(value)
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2")
        .slice(0, 15);
}

function maskCep(value: string) {
    return onlyDigits(value).replace(/(\d{5})(\d)/, "$1-$2").slice(0, 9);
}

function validateCpf(cpf: string) {
    return onlyDigits(cpf).length === 11;
}

function validateBirthDate(value: string) {
    if (!value) return false;
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return false;
    return year > 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31;
}


function normalizeBusinessUrl(url: string) {
    const trimmed = url.trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
}

function parseIncomeValue(value: string): number {
    if (!value) return 0;
    // Handle BR format: "5.000,00" -> 5000.00, or plain "5000" -> 5000
    return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
}

function buildOnboardingPayload(
    formData: FormData,
    docs: UploadedDocIds
): Record<string, unknown> {
    const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();

    // Payload aligned with Asaas POST /v3/accounts fields
    return {
        // Asaas subconta fields
        name: fullName,
        email: '', // Will be filled from user session in the edge function
        cpfCnpj: onlyDigits(formData.cpf),
        birthDate: formData.birthDate, // YYYY-MM-DD
        mobilePhone: onlyDigits(formData.phone),
        companyType: formData.companyType || undefined,
        incomeValue: parseIncomeValue(formData.incomeValue) || undefined,
        // Address fields (Asaas format)
        address: formData.street.trim(),
        addressNumber: formData.number.trim(),
        complement: formData.complement.trim() || undefined,
        province: formData.neighborhood.trim(), // Asaas calls it 'province'
        postalCode: onlyDigits(formData.cep),
        // Business info
        site: normalizeBusinessUrl(formData.businessUrl) || undefined,
        // Profile extras for internal use
        profile: {
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
            political_exposure: formData.pep,
            city: formData.city.trim(),
            state: formData.state.trim().toUpperCase(),
        },
        business_profile: {
            mcc: "8099",
            product_description: formData.businessDescription.trim(),
        },
        bank_account: {
            country: "BR",
            currency: "brl",
            account_holder_type: "individual",
            account_holder_name: fullName,
            cpfCnpj: onlyDigits(formData.cpf),
            bank_code: onlyDigits(formData.bankCode),
            agency: onlyDigits(formData.agency),
            account_number: onlyDigits(formData.accountNumber),
            account_type: "CONTA_CORRENTE",
        },
        documents: {
            front_file_id: docs.front || null,
            back_file_id: docs.back || null,
        },
        tos: {
            accepted: formData.tosAccepted,
        },
    };
}

function GlassCard({
    title,
    subtitle,
    icon,
    children,
}: {
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="relative overflow-hidden rounded-[22px] border border-black/[0.07] bg-white/[0.82] p-4 shadow-[0_18px_60px_-38px_rgba(0,0,0,0.35)] backdrop-blur-3xl transition-[border-color,box-shadow,transform] duration-500 sm:p-5 dark:border-white/[0.08] dark:bg-[#111111]/[0.82] dark:shadow-[0_24px_70px_-42px_rgba(0,0,0,0.9)]">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.025] mix-blend-multiply dark:mix-blend-screen"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.7'/%3E%3C/svg%3E\")" }}
            />
            <div className="relative z-10 mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/5 bg-black/[0.02] text-zinc-900 backdrop-blur-xl dark:border-white/5 dark:bg-white/[0.02] dark:text-white">
                    {icon}
                </div>
                <div>
                    <h2 className="text-base font-black uppercase tracking-tight text-zinc-950 dark:text-white">
                        {title}
                    </h2>
                    {subtitle ? (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>
                    ) : null}
                </div>
            </div>
            <div className="relative z-10">{children}</div>
        </div>
    );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <Label className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            {children}
        </Label>
    );
}

export const CustomOnboardingFlow = ({
    onComplete,
    onCancel,
    fullScreen = false,
}: CustomOnboardingFlowProps) => {
    const [step, setStep] = useState<Step>("personal");
    const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPolling, setIsPolling] = useState(false);
    const [uploadedDocIds, setUploadedDocIds] = useState<UploadedDocIds>({});
    const [files, setFiles] = useState<{ front: File | null; back: File | null }>({
        front: null,
        back: null,
    });

    const fileInputFrontRef = useRef<HTMLInputElement>(null);
    const fileInputBackRef = useRef<HTMLInputElement>(null);
    const hasPrefilledRef = useRef(false);

    const {
        account,
        startOnboarding,
        updateAccount,
        uploadFile,
        syncAccount,
        isLoading: accountLoading,
    } = useFinancialAccount();

    useEffect(() => {
        if (!account || hasPrefilledRef.current) return;

        const metadata = account.metadata || {};
        const snapshot = account.onboarding_payload || {};
        const profile = snapshot.profile || {};
        const businessProfile = snapshot.business_profile || {};
        const bankAccount = snapshot.bank_account || {};
        const accountNumber = [
            account.bank_account || bankAccount.account_number || "",
            account.bank_account_digit || bankAccount.account_digit || "",
        ].join("");

        setFormData((prev) => ({
            ...prev,
            firstName: account.holder_name?.split(" ")[0] || profile.first_name || prev.firstName,
            lastName: account.holder_name?.split(" ").slice(1).join(" ") || profile.last_name || prev.lastName,
            cpf: maskCpf(account.cpf_cnpj || snapshot.cpfCnpj || prev.cpf),
            birthDate: account.birth_date || snapshot.birthDate || prev.birthDate,
            phone: maskPhone(account.mobile_phone || snapshot.mobilePhone || prev.phone),
            pep: account.pep_status || profile.political_exposure || prev.pep,
            cep: maskCep(account.address_postal_code || snapshot.postalCode || prev.cep),
            street: account.address_street || snapshot.address || prev.street,
            number: account.address_number || snapshot.addressNumber || prev.number,
            complement: account.address_complement || snapshot.complement || prev.complement,
            neighborhood: account.address_neighborhood || snapshot.province || prev.neighborhood,
            city: account.address_city || profile.city || prev.city,
            state: account.address_state || profile.state || prev.state,
            companyType: account.company_type || snapshot.companyType || prev.companyType,
            incomeValue: account.income_value ? String(account.income_value) : (snapshot.incomeValue ? String(snapshot.incomeValue) : prev.incomeValue),
            businessUrl: account.business_url || snapshot.site || prev.businessUrl,
            businessDescription: account.business_description || businessProfile.product_description || prev.businessDescription,
            bankCode: account.bank_code || bankAccount.bank_code || prev.bankCode,
            agency: account.bank_agency || bankAccount.agency || prev.agency,
            accountNumber: accountNumber || prev.accountNumber,
            tosAccepted: Boolean(account.tos_accepted_at || snapshot.tos?.accepted || prev.tosAccepted),
        }));

        setUploadedDocIds({
            front: account.document_front_id || snapshot.documents?.front_file_id || metadata.document_front_id || undefined,
            back: account.document_back_id || snapshot.documents?.back_file_id || metadata.document_back_id || undefined,
        });
        hasPrefilledRef.current = true;
    }, [account]);

    const steps: Step[] = useMemo(
        () => ["personal", "business", "banking", "verification", "review"],
        []
    );

    const currentIndex = steps.indexOf(step);

    const setField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
        let nextValue = value;

        if (field === "cpf") nextValue = maskCpf(String(value)) as FormData[K];
        if (field === "phone") nextValue = maskPhone(String(value)) as FormData[K];
        if (field === "cep") nextValue = maskCep(String(value)) as FormData[K];
        if (field === "state")
            nextValue = String(value).toUpperCase().slice(0, 2) as FormData[K];
        if (field === "bankCode")
            nextValue = onlyDigits(String(value)).slice(0, 3) as FormData[K];
        if (field === "agency")
            nextValue = onlyDigits(String(value)).slice(0, 10) as FormData[K];

        setFormData((prev) => ({ ...prev, [field]: nextValue }));
    };


    async function uploadDocumentsIfNeeded() {
        const result: UploadedDocIds = { ...uploadedDocIds };

        if (files.front && !result.front) {
            const formData = new FormData();
            formData.append("file", files.front);
            formData.append("document_type", "IDENTIFICATION");
            const response = await uploadFile.mutateAsync(formData);
            result.front = (response as any)?.document?.id;
        }

        if (files.back && !result.back) {
            const formData = new FormData();
            formData.append("file", files.back);
            formData.append("document_type", "IDENTIFICATION");
            const response = await uploadFile.mutateAsync(formData);
            result.back = (response as any)?.document?.id;
        }

        setUploadedDocIds(result);
        return result;
    }

    // ... validation methods omitted for brevity, keeping them as is ...
    function validatePersonalStep() {
        if (!formData.firstName.trim()) return "Informe seu nome.";
        if (!formData.lastName.trim()) return "Informe seu sobrenome.";
        if (!validateCpf(formData.cpf)) return "Informe um CPF válido.";
        if (!validateBirthDate(formData.birthDate))
            return "Informe uma data de nascimento válida.";
        if (onlyDigits(formData.phone).length < 10)
            return "Informe um telefone válido.";
        if (!onlyDigits(formData.cep)) return "Informe o CEP.";
        if (!formData.street.trim()) return "Informe a rua.";
        if (!formData.number.trim()) return "Informe o número.";
        if (!formData.city.trim()) return "Informe a cidade.";
        if (formData.state.trim().length !== 2) return "Informe a UF com 2 letras.";
        return null;
    }

    function validateBusinessStep() {
        if (!formData.businessDescription.trim()) {
            return "Informe a descrição dos serviços.";
        }
        return null;
    }

    function validateBankingStep() {
        if (onlyDigits(formData.bankCode).length !== 3) {
            return "Informe um código bancário com 3 dígitos.";
        }
        if (!onlyDigits(formData.agency)) {
            return "Informe a agência.";
        }
        if (onlyDigits(formData.accountNumber).length < 4) {
            return "Informe uma conta bancária válida.";
        }
        return null;
    }

    function validateVerificationStep() {
        if (!files.front && !uploadedDocIds.front) {
            return "Envie ao menos a frente do documento.";
        }
        return null;
    }

    async function handleNext() {
        if (step === "personal") {
            const error = validatePersonalStep();
            if (error) return toast.error(error);
            return setStep("business");
        }

        if (step === "business") {
            const error = validateBusinessStep();
            if (error) return toast.error(error);
            return setStep("banking");
        }

        if (step === "banking") {
            const error = validateBankingStep();
            if (error) return toast.error(error);
            return setStep("verification");
        }

        if (step === "verification") {
            const error = validateVerificationStep();
            if (error) return toast.error(error);
            return setStep("review");
        }

        if (step === "review") {
            if (!formData.tosAccepted) {
                return toast.error("Você precisa aceitar os termos para continuar.");
            }
            await handleSubmit();
        }
    }

    function handleBack() {
        if (step === "personal") {
            onCancel?.();
            return;
        }
        if (step === "business") return setStep("personal");
        if (step === "banking") return setStep("business");
        if (step === "verification") return setStep("banking");
        if (step === "review") return setStep("verification");
    }

    async function pollAccountStatus(maxRetries = 12) {
        setIsPolling(true);
        let retries = 0;

        while (retries < maxRetries) {
            try {
                const result = await syncAccount.mutateAsync();
                const status = result?.status || result?.ui_status;

                // If status is no longer 'not_started' or 'account_missing', it means Asaas created it
                if (status && status !== "not_started" && status !== "account_missing") {
                    return true;
                }
            } catch (err) {
                console.warn("[Onboarding] Poll attempt failed:", err);
            }

            retries++;
            // Wait 2.5 seconds between polls (total ~30s max)
            await new Promise((resolve) => setTimeout(resolve, 2500));
        }
        return false;
    }

    async function handleSubmit() {
        setIsSubmitting(true);

        try {
            const currentAccountId = account?.asaas_account_id;

            if (!currentAccountId) {
                // Create subconta via asaas-connect-onboarding first
                const payload = buildOnboardingPayload(formData, uploadedDocIds);
                const onboardingResult = await startOnboarding.mutateAsync(payload as any);
                const newAccountId = (onboardingResult as any)?.asaas_account_id;
                
                if (!newAccountId) {
                    throw new Error("Não foi possível criar a subconta.");
                }
                
                // Immediately attempt to upload documents if provided
                toast.info("Conta criada! Sincronizando dados...");
                
                try {
                    const docs = await uploadDocumentsIfNeeded();
                    const updateResult = await updateAccount.mutateAsync(buildOnboardingPayload(formData, docs));
                    if (updateResult?.sync_status === "deferred") {
                        toast.warning("Dados salvos. Alguns campos ainda aguardam validação da Asaas.");
                    }
                } catch (docErr) {
                    console.warn("Upload imediato falhou, será tentado novamente:", docErr);
                }

                // Poll for status update (Asaas sync window)
                const synced = await pollAccountStatus();
                if (!synced) {
                    toast.warning("A conta foi criada, mas a validação completa pode levar alguns minutos.");
                }
            } else {
                // Account already exists — update it and upload docs
                const docs = await uploadDocumentsIfNeeded();
                const payload = buildOnboardingPayload(formData, docs);
                const updateResult = await updateAccount.mutateAsync(payload);
                if (updateResult?.sync_status === "deferred") {
                    toast.warning("Dados salvos. A sincronização com a Asaas seguirá em segundo plano.");
                }
                
                // Light sync
                try {
                    await syncAccount.mutateAsync();
                } catch (syncError) {
                    console.warn("[Onboarding] Final sync deferred:", syncError);
                }
            }

            setStep("success");
        } catch (error: any) {
            console.error("[CustomOnboardingFlow] submit error", error);
            toast.error(error?.message || "Não foi possível concluir o onboarding.");
        } finally {
            setIsSubmitting(false);
            setIsPolling(false);
        }
    }

    const renderContent = () => {
        if (step === "success") {
            return (
                <div className="flex flex-col items-center justify-center gap-6 py-20 text-center h-full">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-12 w-12" />
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-white">
                            Conta em análise
                        </h3>
                        <p className="mx-auto max-w-md text-sm text-zinc-500 dark:text-zinc-400">
                            Recebemos seus dados e enviamos tudo para validação. Assim que a conta
                            estiver pronta para receber e sacar, você verá o status atualizado no
                            NeuroFinance.
                        </p>
                    </div>

                    <Button
                        onClick={onComplete}
                        className="h-14 mt-4 rounded-2xl bg-zinc-950 px-8 font-black uppercase tracking-[0.18em] text-white shadow-xl dark:bg-white dark:text-zinc-950"
                    >
                        Ir para o dashboard
                    </Button>
                </div>
            );
        }

        return (
            <>
                <div className="flex min-h-0 flex-col h-full overflow-hidden">
                <div className="shrink-0 mb-5">
                    <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-zinc-950 dark:text-white">
                                Ativar NeuroFinance
                            </h1>
                            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 max-w-md leading-relaxed">
                                A NeuroNex é a sua plataforma de gestão de alta performance. Toda a infraestrutura financeira (BaaS) é provida de forma segura e transparente pela Asaas.
                            </p>
                        </div>

                        {(isSubmitting || accountLoading || isPolling) && (
                            <div className="flex w-fit items-center gap-2 rounded-full border border-black/10 bg-black/[0.03] px-3 py-1.5 text-xs text-zinc-600 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                {isPolling ? "Validando com Asaas..." : "Processando"}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        {steps.map((s, i) => (
                            <div
                                key={s}
                                className={cn(
                                    "h-1.5 flex-1 rounded-full transition-all duration-500",
                                    i <= currentIndex
                                        ? "bg-zinc-950 dark:bg-white"
                                        : "bg-zinc-200 dark:bg-white/10"
                                )}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto px-1 -mx-1 pb-6 scrollbar-hide overscroll-contain">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.22 }}
                        >
                        {step === "personal" && (
                        <GlassCard
                            title="Dados pessoais"
                            subtitle="Identificação civil e endereço residencial."
                            icon={<User className="h-5 w-5" />}
                        >
                            <div className="space-y-6">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <SectionLabel>Nome</SectionLabel>
                                        <Input
                                            value={formData.firstName}
                                            onChange={(e) => setField("firstName", e.target.value)}
                                            placeholder="Seu nome"
                                            className="h-12 rounded-2xl border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/[0.03]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <SectionLabel>Sobrenome</SectionLabel>
                                        <Input
                                            value={formData.lastName}
                                            onChange={(e) => setField("lastName", e.target.value)}
                                            placeholder="Seu sobrenome"
                                            className="h-12 rounded-2xl border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/[0.03]"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <SectionLabel>CPF</SectionLabel>
                                        <Input
                                            value={formData.cpf}
                                            onChange={(e) => setField("cpf", e.target.value)}
                                            placeholder="000.000.000-00"
                                            className="h-12 rounded-2xl border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/[0.03]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <SectionLabel>Telefone</SectionLabel>
                                        <Input
                                            value={formData.phone}
                                            onChange={(e) => setField("phone", e.target.value)}
                                            placeholder="(00) 00000-0000"
                                            className="h-12 rounded-2xl border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/[0.03]"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <SectionLabel>Data de nascimento</SectionLabel>
                                        <Input
                                            type="date"
                                            value={formData.birthDate}
                                            onChange={(e) => setField("birthDate", e.target.value)}
                                            className="h-12 rounded-2xl border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/[0.03]"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <SectionLabel>Exposição política (PEP)</SectionLabel>
                                        <Select
                                            value={formData.pep}
                                            onValueChange={(v: PepValue) => setField("pep", v)}
                                        >
                                            <SelectTrigger className="h-12 rounded-2xl border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/[0.03]">
                                                <SelectValue placeholder="Selecione" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Não sou PEP</SelectItem>
                                                <SelectItem value="existing">Sou PEP</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-4 rounded-[24px] border border-black/10 bg-black/[0.02] p-5 dark:border-white/10 dark:bg-white/[0.02]">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-zinc-500" />
                                        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                                            Endereço residencial
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="col-span-1 space-y-2">
                                            <SectionLabel>CEP</SectionLabel>
                                            <Input
                                                value={formData.cep}
                                                onChange={(e) => setField("cep", e.target.value)}
                                                placeholder="00000-000"
                                                className="h-12 rounded-2xl border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/[0.03]"
                                            />
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <SectionLabel>Rua</SectionLabel>
                                            <Input
                                                value={formData.street}
                                                onChange={(e) => setField("street", e.target.value)}
                                                placeholder="Logradouro"
                                                className="h-12 rounded-2xl border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/[0.03]"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <div className="space-y-2">
                                            <SectionLabel>Número</SectionLabel>
                                            <Input
                                                value={formData.number}
                                                onChange={(e) => setField("number", e.target.value)}
                                                placeholder="123"
                                                className="h-12 rounded-2xl border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/[0.03]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <SectionLabel>Complemento</SectionLabel>
                                            <Input
                                                value={formData.complement}
                                                onChange={(e) => setField("complement", e.target.value)}
                                                placeholder="Apto, sala, etc."
                                                className="h-12 rounded-2xl border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/[0.03]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <SectionLabel>Bairro</SectionLabel>
                                            <Input
                                                value={formData.neighborhood}
                                                onChange={(e) => setField("neighborhood", e.target.value)}
                                                placeholder="Bairro"
                                                className="h-12 rounded-2xl border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/[0.03]"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <SectionLabel>Cidade</SectionLabel>
                                            <Input
                                                value={formData.city}
                                                onChange={(e) => setField("city", e.target.value)}
                                                placeholder="Cidade"
                                                className="h-12 rounded-2xl border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/[0.03]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <SectionLabel>UF</SectionLabel>
                                            <Input
                                                value={formData.state}
                                                onChange={(e) => setField("state", e.target.value)}
                                                placeholder="SP"
                                                maxLength={2}
                                                className="h-12 rounded-2xl border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/[0.03]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    )}

                    {step === "business" && (
                        <GlassCard
                            title="Dados comerciais"
                            subtitle="Informações para cadastro da sua subconta."
                            icon={<Briefcase className="h-5 w-5" />}
                        >
                            <div className="space-y-5">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <SectionLabel>Tipo de empresa</SectionLabel>
                                        <Select
                                            value={formData.companyType}
                                            onValueChange={(v: string) => setField("companyType", v)}
                                        >
                                            <SelectTrigger className="h-12 rounded-2xl border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/[0.03]">
                                                <SelectValue placeholder="Selecione o tipo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="MEI">MEI</SelectItem>
                                                <SelectItem value="LIMITED">Limitada (LTDA)</SelectItem>
                                                <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                                                <SelectItem value="ASSOCIATION">Associação</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <SectionLabel>Faturamento mensal</SectionLabel>
                                        <Input
                                            value={formData.incomeValue}
                                            onChange={(e) => setField("incomeValue", e.target.value.replace(/[^\d.,]/g, ''))}
                                            placeholder="R$ 0,00"
                                            className="h-12 rounded-2xl border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/[0.03]"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <SectionLabel>Site ou perfil profissional <span className="normal-case tracking-normal text-zinc-400">(Opcional)</span></SectionLabel>
                                    <Input
                                        value={formData.businessUrl}
                                        onChange={(e) => setField("businessUrl", e.target.value)}
                                        placeholder="https://seusite.com ou instagram.com/seuperfil"
                                        className="h-12 rounded-2xl border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/[0.03]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <SectionLabel>Descrição do serviço</SectionLabel>
                                    <Input
                                        value={formData.businessDescription}
                                        onChange={(e) =>
                                            setField("businessDescription", e.target.value)
                                        }
                                        placeholder="Ex.: Serviços de psicologia clínica"
                                        className="h-12 rounded-2xl border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/[0.03]"
                                    />
                                </div>

                                <div className="rounded-[24px] border border-emerald-500/15 bg-emerald-500/[0.04] p-4 dark:border-emerald-500/20 dark:bg-emerald-500/[0.06]">
                                    <div className="mb-2 flex items-center gap-2">
                                        <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
                                            Categoria profissional
                                        </span>
                                    </div>
                                    <p className="text-sm text-zinc-700 dark:text-zinc-300">
                                        MCC 8099 configurado para serviços de saúde e profissionais da
                                        área clínica.
                                    </p>
                                </div>
                            </div>
                        </GlassCard>
                    )}

                    {step === "banking" && (
                        <GlassCard
                            title="Conta bancária"
                            subtitle="Conta de mesma titularidade para receber repasses."
                            icon={<Building2 className="h-5 w-5" />}
                        >
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <SectionLabel>Código do banco</SectionLabel>
                                    <Input
                                        value={formData.bankCode}
                                        onChange={(e) => setField("bankCode", e.target.value)}
                                        placeholder="Ex.: 341, 033, 104, 077"
                                        className="h-12 rounded-2xl border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/[0.03]"
                                    />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <SectionLabel>Agência</SectionLabel>
                                        <Input
                                            value={formData.agency}
                                            onChange={(e) => setField("agency", e.target.value)}
                                            placeholder="0001"
                                            className="h-12 rounded-2xl border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/[0.03]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <SectionLabel>Conta + dígito</SectionLabel>
                                        <Input
                                            value={formData.accountNumber}
                                            onChange={(e) => setField("accountNumber", e.target.value)}
                                            placeholder="123456-7"
                                            className="h-12 rounded-2xl border-black/10 bg-white/60 dark:border-white/10 dark:bg-white/[0.03]"
                                        />
                                    </div>
                                </div>

                                <div className="rounded-[24px] border border-amber-500/15 bg-amber-500/[0.05] p-4 dark:border-amber-500/20 dark:bg-amber-500/[0.08]">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="mt-0.5 h-4 w-4 text-amber-700 dark:text-amber-400" />
                                        <p className="text-sm text-amber-800 dark:text-amber-300">
                                            A conta bancária precisa ser da mesma titularidade do CPF enviado
                                            no onboarding.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    )}

                    {step === "verification" && (
                        <GlassCard
                            title="Verificação documental"
                            subtitle="Envie os arquivos para validação KYC."
                            icon={<ShieldCheck className="h-5 w-5" />}
                        >
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div
                                    onClick={() => fileInputFrontRef.current?.click()}
                                    className={cn(
                                        "group cursor-pointer rounded-[24px] border-2 border-dashed p-6 text-center transition-all",
                                        files.front || uploadedDocIds.front
                                            ? "border-emerald-500/50 bg-emerald-500/[0.05]"
                                            : "border-black/10 bg-black/[0.02] hover:bg-black/[0.03] dark:border-white/10 dark:bg-white/[0.02] dark:hover:bg-white/[0.04]"
                                    )}
                                >
                                    <input
                                        ref={fileInputFrontRef}
                                        type="file"
                                        accept="image/*,application/pdf"
                                        className="hidden"
                                        onChange={(e) =>
                                            setFiles((prev) => ({
                                                ...prev,
                                                front: e.target.files?.[0] || null,
                                            }))
                                        }
                                    />

                                    {files.front || uploadedDocIds.front ? (
                                        <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-emerald-500" />
                                    ) : (
                                        <Upload className="mx-auto mb-3 h-8 w-8 text-zinc-400" />
                                    )}

                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-900 dark:text-white">
                                        Frente do documento
                                    </p>
                                    <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                                        {files.front?.name || "RG, CNH ou documento equivalente"}
                                    </p>
                                </div>

                                <div
                                    onClick={() => fileInputBackRef.current?.click()}
                                    className={cn(
                                        "group cursor-pointer rounded-[24px] border-2 border-dashed p-6 text-center transition-all",
                                        files.back || uploadedDocIds.back
                                            ? "border-emerald-500/50 bg-emerald-500/[0.05]"
                                            : "border-black/10 bg-black/[0.02] hover:bg-black/[0.03] dark:border-white/10 dark:bg-white/[0.02] dark:hover:bg-white/[0.04]"
                                    )}
                                >
                                    <input
                                        ref={fileInputBackRef}
                                        type="file"
                                        accept="image/*,application/pdf"
                                        className="hidden"
                                        onChange={(e) =>
                                            setFiles((prev) => ({
                                                ...prev,
                                                back: e.target.files?.[0] || null,
                                            }))
                                        }
                                    />

                                    {files.back || uploadedDocIds.back ? (
                                        <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-emerald-500" />
                                    ) : (
                                        <Upload className="mx-auto mb-3 h-8 w-8 text-zinc-400" />
                                    )}

                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-900 dark:text-white">
                                        Verso do documento
                                    </p>
                                    <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                                        {files.back?.name || "Opcional quando aplicável"}
                                    </p>
                                </div>
                            </div>
                        </GlassCard>
                    )}

                    {step === "review" && (
                        <GlassCard
                            title="Revisão final"
                            subtitle="Confira tudo antes de enviar para validação."
                            icon={<ShieldCheck className="h-5 w-5" />}
                        >
                            <div className="space-y-4">
                                <div className="relative rounded-[24px] border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.02]">
                                    <button
                                        onClick={() => setStep("personal")}
                                        className="absolute right-4 top-4 rounded-lg p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">
                                        Dados pessoais
                                    </p>
                                    <div className="grid gap-y-3 sm:grid-cols-2">
                                        <div>
                                            <p className="text-[10px] uppercase text-zinc-500">Nome</p>
                                            <p className="text-sm font-bold text-zinc-950 dark:text-white">
                                                {formData.firstName} {formData.lastName}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase text-zinc-500">CPF</p>
                                            <p className="text-sm font-bold text-zinc-950 dark:text-white">
                                                {formData.cpf}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase text-zinc-500">Nascimento</p>
                                            <p className="text-sm font-bold text-zinc-950 dark:text-white">
                                                {formData.birthDate.split("-").reverse().join("/")}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase text-zinc-500">Telefone</p>
                                            <p className="text-sm font-bold text-zinc-950 dark:text-white">
                                                {formData.phone}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative rounded-[24px] border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.02]">
                                    <button
                                        onClick={() => setStep("business")}
                                        className="absolute right-4 top-4 rounded-lg p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">
                                        Dados do negócio
                                    </p>
                                    <div className="space-y-2">
                                        <div>
                                            <p className="text-[10px] uppercase text-zinc-500">Descrição</p>
                                            <p className="text-sm font-bold text-zinc-950 dark:text-white">
                                                {formData.businessDescription}
                                            </p>
                                        </div>
                                        {!!formData.businessUrl.trim() && (
                                            <div>
                                                <p className="text-[10px] uppercase text-zinc-500">Site / perfil</p>
                                                <p className="truncate text-sm font-bold text-zinc-950 dark:text-white">
                                                    {normalizeBusinessUrl(formData.businessUrl)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="relative rounded-[24px] border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.02]">
                                    <button
                                        onClick={() => setStep("banking")}
                                        className="absolute right-4 top-4 rounded-lg p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">
                                        Conta bancária
                                    </p>
                                    <div className="grid gap-y-3 sm:grid-cols-2">
                                        <div>
                                            <p className="text-[10px] uppercase text-zinc-500">Banco</p>
                                            <p className="text-sm font-bold text-zinc-950 dark:text-white">
                                                {formData.bankCode}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase text-zinc-500">Agência / conta</p>
                                            <p className="text-sm font-bold text-zinc-950 dark:text-white">
                                                {formData.agency} / {formData.accountNumber}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative rounded-[24px] border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.02]">
                                    <button
                                        onClick={() => setStep("verification")}
                                        className="absolute right-4 top-4 rounded-lg p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">
                                        Documentos
                                    </p>
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                            <span className="text-[11px] font-bold uppercase tracking-[0.18em]">
                                                Frente
                                            </span>
                                        </div>
                                        {(files.back || uploadedDocIds.back) && (
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                <span className="text-[11px] font-bold uppercase tracking-[0.18em]">
                                                    Verso
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-[24px] border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.02]">
                                    <div className="flex items-start gap-3">
                                        <input
                                            id="tos"
                                            type="checkbox"
                                            checked={formData.tosAccepted}
                                            onChange={(e) => setField("tosAccepted", e.target.checked)}
                                            className="mt-1"
                                        />
                                        <Label
                                            htmlFor="tos"
                                            className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-300"
                                        >
                                            Concordo com os{" "}
                                            <button
                                                type="button"
                                                onClick={() => setIsTermsModalOpen(true)}
                                                className="font-bold underline"
                                            >
                                                Termos de Serviço
                                            </button>{" "}
                                            e autorizo o envio dos meus dados para validação KYC e
                                            ativação da conta conectada.
                                        </Label>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    )}
                </motion.div>
            </AnimatePresence>
            </div>

            <div className="shrink-0 mt-3 flex flex-col gap-4 border-t border-black/10 bg-white/70 pt-4 backdrop-blur-2xl dark:border-white/10 dark:bg-[#080808]/70">
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={isSubmitting}
                        className="h-14 flex-1 rounded-2xl border-black/10 bg-white/50 font-bold uppercase tracking-[0.18em] text-[10px] backdrop-blur-xl transition-all duration-300 active:scale-[0.985] dark:border-white/10 dark:bg-white/[0.03] hover:bg-black/5 dark:hover:bg-white/5"
                    >
                        {step === "personal" ? (
                            "Cancelar"
                        ) : (
                            <>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Voltar
                            </>
                        )}
                    </Button>

                    <Button
                        onClick={handleNext}
                        disabled={isSubmitting}
                        className="h-14 flex-[1.4] rounded-2xl bg-zinc-950 font-black uppercase tracking-[0.18em] text-[10px] text-white shadow-[0_18px_36px_-18px_rgba(0,0,0,0.65)] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.985] dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processando
                            </>
                        ) : (
                            <>
                                {step === "review" ? "Concluir onboarding" : "Próximo passo"}
                                {step !== "review" && <ArrowRight className="ml-2 h-4 w-4" />}
                            </>
                        )}
                    </Button>
                </div>
                </div>
            </div>

            <TermsOfUseModal
                isOpen={isTermsModalOpen}
                onOpenChange={setIsTermsModalOpen}
            />
            </>
        );
    };

    return (
        <div className={cn(
            "relative isolate w-full flex min-h-0 flex-col lg:flex-row overflow-hidden bg-white dark:bg-[#080808]",
            fullScreen 
                ? "h-[100dvh] max-h-[100dvh]"
                : "h-[100dvh] max-h-[100dvh] shadow-[0_30px_120px_rgba(0,0,0,0.15)] dark:shadow-[0_30px_120px_rgba(0,0,0,0.6)] sm:h-[90vh] sm:max-h-[950px] sm:rounded-[36px] border border-black/5 dark:border-white/5"
        )}>
            
            {/* Left Column - 3D Visual & Compliance */}
            <div className="hidden lg:flex lg:w-[34%] xl:w-[36%] shrink-0 relative bg-zinc-50 dark:bg-[#0c0c0c] border-r border-black/5 dark:border-white/5 overflow-hidden items-center justify-center p-8 xl:p-10">
                <div className="absolute inset-0 bg-radial-gradient from-black/[0.03] dark:from-white/[0.03] to-transparent opacity-60 backdrop-blur-3xl" />
                
                {/* Stamp at top-left inner */}
                <div className="absolute top-8 left-8 z-20">
                    <AsaasStamp className="opacity-70 scale-90 origin-left hover:opacity-100 transition-opacity" />
                </div>
                
                {/* Text bottom */}
                <div className="absolute bottom-8 left-8 right-8 z-20">
                    <h3 className="text-xl font-black tracking-tight text-zinc-950 dark:text-white mb-1.5">
                        NeuroFinance
                    </h3>
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        Ativação rápida e segura. Infraestrutura tecnológica viabilizada em parceria com a Instituição de Pagamento Asaas.
                    </p>
                </div>
                
                {/* 3D Model */}
                <div className="relative z-10 w-full h-full flex items-center justify-center scale-90 xl:scale-100 transition-transform duration-700">
                    <NeuroFinanceCardVisual performanceMode />
                </div>
            </div>

            {/* Right Column - Formulation / Form */}
            <div className="flex-1 flex min-h-0 flex-col h-full min-w-0 bg-white dark:bg-[#080808] relative overflow-hidden">
                <div className="flex-1 min-h-0 w-full p-4 sm:p-5 lg:p-6 xl:p-7 flex flex-col h-full overflow-hidden lg:[zoom:.88] xl:[zoom:.92] 2xl:[zoom:.96]">
                   {renderContent()}
                </div>
            </div>
        </div>
    );
};
