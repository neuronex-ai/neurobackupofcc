import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Building, MapPin, ShieldCheck, Upload, User, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { AsaasStamp } from "@/components/financeiro/AsaasStamp";

interface NeuroFinanceOnboardingStepsProps {
    onCancel: () => void;
    onComplete: () => void;
}

type Step = 'personal' | 'address' | 'banking' | 'documents' | 'processing' | 'success';

export const NeuroBankOnboardingSteps = ({ onCancel, onComplete }: NeuroFinanceOnboardingStepsProps) => {
    const [step, setStep] = useState<Step>('personal');

    const [documentFront, setDocumentFront] = useState<File | null>(null);
    const [documentBack, setDocumentBack] = useState<File | null>(null);
    const fileInputFrontRef = useRef<HTMLInputElement>(null);
    const fileInputBackRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back') => {
        const file = e.target.files?.[0];
        if (file) {
            if (type === 'front') setDocumentFront(file);
            else setDocumentBack(file);
        }
    };

    const convertToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    // Form State — aligned with Asaas API field names
    const [formData, setFormData] = useState({
        cpf: "",
        birthDate: "",
        phone: "",              // mapped to mobilePhone on Asaas
        companyType: "",        // ASAAS: MEI, LIMITED, INDIVIDUAL, etc.
        incomeValue: "",        // ASAAS: faturamento mensal
        cep: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",       // mapped to province on Asaas
        city: "",
        state: "",
        bankCode: "",
        agency: "",
        accountNumber: "",
        accountDigit: "",
        politicalExposure: "none"
    });

    const masks = {
        cpf: (value: string) => value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1'),
        phone: (value: string) => value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1'),
        cep: (value: string) => value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{3})\d+?$/, '$1'),
        number: (value: string) => value.replace(/\D/g, ''),
        agency: (value: string) => value.replace(/\D/g, '').slice(0, 4),
        accountNumber: (value: string) => value.replace(/\D/g, '').replace(/(\d+)(\d{1})$/, '$1-$2'), // simple mask for digit, won't cover all cases perfectly but helps
    };

    const updateData = (field: keyof typeof formData, value: string) => {
        let formattedValue = value;
        if (field === 'cpf') formattedValue = masks.cpf(value);
        if (field === 'phone') formattedValue = masks.phone(value);
        if (field === 'cep') formattedValue = masks.cep(value);
        if (field === 'number') formattedValue = masks.number(value);
        if (field === 'agency') formattedValue = masks.agency(value);
        if (field === 'accountNumber' && !value.includes('-')) formattedValue = masks.accountNumber(value);

        setFormData(prev => ({ ...prev, [field]: formattedValue }));
    };

    const handleNext = () => {
        if (step === 'personal') setStep('address');
        else if (step === 'address') setStep('banking');
        else if (step === 'banking') setStep('documents');
        else if (step === 'documents') handleSubmit();
    };

    const handleBack = () => {
        if (step === 'address') setStep('personal');
        else if (step === 'banking') setStep('address');
        else if (step === 'documents') setStep('banking');
        else if (step === 'personal') onCancel();
    };

    const handleSubmit = async () => {
        if (!documentFront) {
            toast.error("Por favor, envie a frente do seu documento.");
            return;
        }

        // basic validation
        if (documentFront.size < 1000) {
            toast.error("O arquivo da frente do documento parece ser inválido ou muito pequeno.");
            return;
        }

        setStep('processing');

        try {
            console.log("Starting KYC submission...", {
                front: documentFront.name,
                frontSize: documentFront.size,
                back: documentBack?.name,
                backSize: documentBack?.size
            });

            const documentFrontBase64 = await convertToBase64(documentFront);
            const documentBackBase64 = documentBack ? await convertToBase64(documentBack) : undefined;

            const payload = {
                ...formData,
                documentFrontBase64,
                documentBackBase64
            };

            const { data, error: invokeError } = await supabase.functions.invoke('asaas-submit-kyc', {
                body: payload,
            });

            if (invokeError) {
                // Try to get detailed error from body
                let msg = invokeError.message;
                try {
                    const body = await invokeError.context.json();
                    if (body.error) msg = body.error;
                } catch (e) {
                    console.error("Failed to parse error body", e);
                }
                throw new Error(msg);
            }

            if (data?.error) throw new Error(data.error);

            // Special case: if account was already verified, we show success immediately
            if (data?.wasAlreadyVerified) {
                console.log("Account was already verified, proceeding to success.");
            }

            setStep('success');
            toast.success("Dados enviados! Conta NeuroFinance em análise.");
        } catch (error: any) {
            console.error('Submit KYC Error:', error);

            // Handle different types of errors
            const errorMessage = error instanceof Error ? error.message : "Erro ao enviar dados para análise.";
            toast.error(errorMessage);

            setStep('documents');
        }
    };

    const variants = {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 }
    };

    const renderStepContent = () => {
        switch (step) {
            case 'personal':
                return (
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <Label className="uppercase tracking-[0.2em] text-[10px] font-bold text-zinc-500">CPF ou CNPJ</Label>
                            <Input className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-lg tracking-widest font-medium focus-visible:ring-foreground" placeholder="000.000.000-00" value={formData.cpf} onChange={(e) => updateData('cpf', e.target.value)} />
                        </div>
                        <div className="flex gap-4">
                            <div className="space-y-3 flex-1">
                                <Label className="uppercase tracking-[0.2em] text-[10px] font-bold text-zinc-500">Data de Nascimento</Label>
                                <Input className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-lg tracking-widest font-medium focus-visible:ring-foreground" type="date" value={formData.birthDate} onChange={(e) => updateData('birthDate', e.target.value)} />
                            </div>
                            <div className="space-y-3 flex-1">
                                <Label className="uppercase tracking-[0.2em] text-[10px] font-bold text-zinc-500">Celular</Label>
                                <Input className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-lg tracking-widest font-medium focus-visible:ring-foreground" placeholder="(11) 90000-0000" value={formData.phone} onChange={(e) => updateData('phone', e.target.value)} />
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="space-y-3 flex-1">
                                <Label className="uppercase tracking-[0.2em] text-[10px] font-bold text-zinc-500">Tipo de Empresa</Label>
                                <select
                                    className="h-14 w-full rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 text-sm font-medium px-4 focus:outline-none focus:ring-2 focus:ring-foreground appearance-none"
                                    value={formData.companyType}
                                    onChange={(e) => updateData('companyType', e.target.value)}
                                >
                                    <option value="">Selecione o tipo</option>
                                    <option value="MEI">MEI</option>
                                    <option value="LIMITED">Limitada (LTDA)</option>
                                    <option value="INDIVIDUAL">Individual</option>
                                    <option value="ASSOCIATION">Associação</option>
                                </select>
                            </div>
                            <div className="space-y-3 flex-1">
                                <Label className="uppercase tracking-[0.2em] text-[10px] font-bold text-zinc-500">Faturamento Mensal</Label>
                                <Input className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-lg font-medium focus-visible:ring-foreground" placeholder="R$ 0,00" value={formData.incomeValue} onChange={(e) => updateData('incomeValue', e.target.value.replace(/[^\d.,]/g, ''))} />
                            </div>
                        </div>
                        <div className="space-y-3 pt-2">
                            <Label className="uppercase tracking-[0.2em] text-[10px] font-bold text-zinc-500">Pessoa Politicamente Exposta (PEP)</Label>
                            <div className="flex items-center space-x-6 h-14 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl px-5 border border-zinc-200 dark:border-white/10">
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input type="radio" value="none" checked={formData.politicalExposure === "none"} onChange={(e) => updateData('politicalExposure', e.target.value)} className="w-4 h-4 accent-foreground" />
                                    <span className="text-sm font-medium">Não</span>
                                </label>
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input type="radio" value="existing" checked={formData.politicalExposure === "existing"} onChange={(e) => updateData('politicalExposure', e.target.value)} className="w-4 h-4 accent-foreground" />
                                    <span className="text-sm font-medium">Sim</span>
                                </label>
                            </div>
                        </div>
                    </div>
                );
            case 'address':
                return (
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="space-y-3 flex-1">
                                <Label className="uppercase tracking-[0.2em] text-[10px] font-bold text-zinc-500">CEP</Label>
                                <Input className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-lg tracking-widest font-medium focus-visible:ring-foreground" placeholder="00000-000" value={formData.cep} onChange={(e) => updateData('cep', e.target.value)} />
                            </div>
                            <div className="space-y-3 flex-[2]">
                                <Label className="uppercase tracking-[0.2em] text-[10px] font-bold text-zinc-500">Cidade</Label>
                                <Input className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-lg font-medium focus-visible:ring-foreground" placeholder="Sua Cidade" value={formData.city} onChange={(e) => updateData('city', e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Label className="uppercase tracking-[0.2em] text-[10px] font-bold text-zinc-500">Rua / Logradouro</Label>
                            <Input className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-lg font-medium focus-visible:ring-foreground" placeholder="Rua, Avenida, etc" value={formData.street} onChange={(e) => updateData('street', e.target.value)} />
                        </div>
                        <div className="flex gap-4">
                            <div className="space-y-3 flex-1">
                                <Label className="uppercase tracking-[0.2em] text-[10px] font-bold text-zinc-500">Número</Label>
                                <Input className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-lg font-medium focus-visible:ring-foreground" placeholder="123" value={formData.number} onChange={(e) => updateData('number', e.target.value)} />
                            </div>
                            <div className="space-y-3 flex-1">
                                <Label className="uppercase tracking-[0.2em] text-[10px] font-bold text-zinc-500">Bairro</Label>
                                <Input className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-lg font-medium focus-visible:ring-foreground" placeholder="Centro" value={formData.neighborhood} onChange={(e) => updateData('neighborhood', e.target.value)} />
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="space-y-3 flex-1">
                                <Label className="uppercase tracking-[0.2em] text-[10px] font-bold text-zinc-500">UF</Label>
                                <Input className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-lg font-medium focus-visible:ring-foreground uppercase" placeholder="SP" maxLength={2} value={formData.state} onChange={(e) => updateData('state', e.target.value.toUpperCase())} />
                            </div>
                            <div className="space-y-3 flex-[2]">
                                <Label className="uppercase tracking-[0.2em] text-[10px] font-bold text-zinc-500">Complemento <span className="text-zinc-400 normal-case tracking-normal">(Opcional)</span></Label>
                                <Input className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-lg font-medium focus-visible:ring-foreground" placeholder="Apto 42" value={formData.complement} onChange={(e) => updateData('complement', e.target.value)} />
                            </div>
                        </div>
                    </div>
                );
            case 'banking':
                return (
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <Label className="uppercase tracking-[0.2em] text-[10px] font-bold text-zinc-500">Código do Banco</Label>
                            <Input className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-lg font-medium focus-visible:ring-foreground" placeholder="Ex: 341 (Itaú), 033 (Santander)" value={formData.bankCode} onChange={(e) => updateData('bankCode', e.target.value.replace(/\D/g, '').slice(0, 3))} />
                        </div>
                        <div className="flex gap-4">
                            <div className="space-y-3 flex-[1.5]">
                                <Label className="uppercase tracking-[0.2em] text-[10px] font-bold text-zinc-500">Agência (sem dígito)</Label>
                                <Input className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-lg tracking-widest font-medium focus-visible:ring-foreground" placeholder="0000" value={formData.agency} onChange={(e) => updateData('agency', e.target.value)} />
                            </div>
                            <div className="space-y-3 flex-[2]">
                                <Label className="uppercase tracking-[0.2em] text-[10px] font-bold text-zinc-500">Conta e dígito</Label>
                                <Input className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 text-lg tracking-widest font-medium focus-visible:ring-foreground" placeholder="00000-0" value={formData.accountNumber} onChange={(e) => updateData('accountNumber', e.target.value)} />
                            </div>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-2">
                            A conta para recebimentos deve estar atrelada ao mesmo CPF informado.
                        </p>
                    </div>
                );
            case 'documents':
                return (
                    <div className="space-y-4">
                        <input type="file" ref={fileInputFrontRef} className="hidden" accept="image/jpeg,image/png,application/pdf" onChange={(e) => handleFileChange(e, 'front')} />
                        <input type="file" ref={fileInputBackRef} className="hidden" accept="image/jpeg,image/png,application/pdf" onChange={(e) => handleFileChange(e, 'back')} />

                        <div onClick={() => fileInputFrontRef.current?.click()} className={`p-4 border-2 border-dashed ${documentFront ? 'border-green-500 bg-green-50/50 dark:bg-green-500/10' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50'} rounded-xl flex flex-col items-center justify-center text-center cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors`}>
                            {documentFront ? <CheckCircle2 className="w-8 h-8 text-green-500 mb-2" /> : <Upload className="w-8 h-8 text-zinc-400 mb-2" />}
                            <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{documentFront ? 'Frente Anexada' : 'Frente do Documento (RG/CNH)'}</p>
                            <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest font-bold">{documentFront ? documentFront.name : 'Clique ou arraste (PNG, JPG, PDF)'}</p>
                        </div>
                        <div onClick={() => fileInputBackRef.current?.click()} className={`p-4 border-2 border-dashed ${documentBack ? 'border-green-500 bg-green-50/50 dark:bg-green-500/10' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50'} rounded-xl flex flex-col items-center justify-center text-center cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors`}>
                            {documentBack ? <CheckCircle2 className="w-8 h-8 text-green-500 mb-2" /> : <Upload className="w-8 h-8 text-zinc-400 mb-2" />}
                            <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{documentBack ? 'Verso Anexado' : 'Verso do Documento (Opcional para CNH)'}</p>
                            <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest font-bold">{documentBack ? documentBack.name : 'Clique ou arraste (PNG, JPG, PDF)'}</p>
                        </div>
                        <div className="flex gap-2 items-start mt-2 p-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                            <ShieldCheck className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-zinc-500 leading-tight">Garantimos a segurança nível bancário. Seus documentos são criptografados de ponta-a-ponta.</p>
                        </div>
                    </div>
                );
            case 'processing':
                return (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                        <Loader2 className="w-12 h-12 text-zinc-900 dark:text-white animate-spin" />
                        <div>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Criando Conta</h3>
                            <p className="text-sm text-zinc-500 mt-1">Conectando ambiente seguro NeuroFinance...</p>
                        </div>
                    </div>
                );
            case 'success':
                return (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                        <div className="w-16 h-16 bg-green-500 dark:bg-green-500/20 rounded-full flex items-center justify-center text-white dark:text-green-500">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Conta Criada!</h3>
                            <p className="text-sm text-zinc-500 mt-2 max-w-sm">
                                Suas informações estão sendo analisadas pela nossa equipe de compliance. Te notificaremos quando tudo estiver pronto.
                            </p>
                        </div>
                        <Button onClick={onComplete} className="w-full mt-6 rounded-[14px]">
                            Acessar Dashboard
                        </Button>
                    </div>
                );
        }
    };

    const getStepTitle = () => {
        switch (step) {
            case 'personal': return { title: "Identificação", icon: User, desc: "Dados pessoais e comerciais" };
            case 'address': return { title: "Endereço", icon: MapPin, desc: "Endereço completo para cadastro" };
            case 'banking': return { title: "Conta Bancária", icon: Building, desc: "Para onde irão seus saques" };
            case 'documents': return { title: "KYC e Segurança", icon: ShieldCheck, desc: "Verificação de identidade" };
            default: return null;
        }
    };

    const stepInfo = getStepTitle();

    return (
        <div className="flex flex-col h-full min-h-[440px] w-full relative z-10 w-full animate-fade-in mx-auto lg:mx-0 text-left bg-white dark:bg-zinc-950 p-6 rounded-[32px] border border-zinc-200 dark:border-white/10 shadow-2xl">
            {/* Header */}
            {stepInfo && (
                <div className="mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-2xl text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/10 shadow-inner">
                            <stepInfo.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tighter uppercase text-zinc-900 dark:text-white">{stepInfo.title}</h2>
                            <p className="text-sm font-medium text-zinc-500 mt-1">{stepInfo.desc}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 relative">
                <AnimatePresence mode="popLayout">
                    <motion.div
                        key={step}
                        variants={variants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        {renderStepContent()}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Footer Buttons */}
            {step !== 'processing' && step !== 'success' && (
                <div className="mt-8 flex flex-col gap-4 pt-6 border-t border-zinc-100 dark:border-zinc-800/50">
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={handleBack} className="flex-1 h-14 rounded-2xl border-zinc-200 dark:border-white/10">
                            {step === 'personal' ? 'Cancelar' : <><ArrowLeft className="w-4 h-4 mr-2" /> Voltar</>}
                        </Button>
                        <Button onClick={handleNext} className="flex-[2] h-14 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:scale-[1.02] transition-transform font-black text-[11px] uppercase tracking-[0.2em] shadow-xl">
                            {step === 'documents' ? 'Concluir' : 'Próximo Passo'}
                            {step !== 'documents' && <ArrowRight className="w-4 h-4 ml-2" />}
                        </Button>
                    </div>
                    {/* Selo Asaas — conformidade regulatória */}
                    <AsaasStamp />
                </div>
            )}
        </div>
    );
};
