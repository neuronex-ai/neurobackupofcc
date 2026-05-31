"use client";

import { useFinancialAccount } from "@/hooks/use-financial-account";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Clock, ChevronRight, Info } from "lucide-react";
import { motion } from "framer-motion";

interface RequirementsListProps {
  onSelectRequirement: (id: string) => void;
  activeRequirement: string | null;
}

export const RequirementsList = ({ onSelectRequirement, activeRequirement }: RequirementsListProps) => {
  const { requirements, isLoading } = useFinancialAccount();

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-zinc-100 dark:bg-white/5 rounded-2xl" />
        ))}
      </div>
    );
  }

  const currentlyDue = requirements?.currently_due || [];
  const eventuallyDue = requirements?.eventually_due || [];
  const pastDue = requirements?.past_due || [];
  const pendingVerification = requirements?.pending_verification || [];

  const allItems = [
    ...pastDue.map((id: string) => ({ id, status: 'critical', label: id })),
    ...currentlyDue.map((id: string) => ({ id, status: 'due', label: id })),
    ...pendingVerification.map((id: string) => ({ id, status: 'pending', label: id })),
    ...eventuallyDue.map((id: string) => ({ id, status: 'upcoming', label: id })),
  ];

  if (allItems.length === 0) {
    return (
      <div className="text-center py-12 px-6">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
        </div>
        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-white">Tudo em ordem</h4>
        <p className="text-[9px] text-zinc-500 uppercase tracking-tight mt-2 leading-relaxed">Não há pendências de verificação na sua conta no momento.</p>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'due': return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-blue-500" />;
      default: return <Info className="w-4 h-4 text-zinc-400" />;
    }
  };

  const formatLabel = (label: string) => {
    const translations: Record<string, string> = {
      "individual.dob.day": "Dia de Nascimento",
      "individual.dob.month": "Mês de Nascimento",
      "individual.dob.year": "Ano de Nascimento",
      "individual.address.city": "Cidade",
      "individual.address.line1": "Endereço",
      "individual.address.postal_code": "CEP",
      "individual.address.state": "Estado",
      "individual.email": "E-mail",
      "individual.first_name": "Nome",
      "individual.last_name": "Sobrenome",
      "individual.phone": "Telefone",
      "individual.id_number": "CPF",
      "individual.verification.document": "Documento de Identidade",
      "individual.verification.additional_document": "Documento Adicional",
      "business_profile.url": "Site da Empresa",
      "business_profile.mcc": "Categoria do Negócio",
      "external_account": "Conta Bancária",
      "tos_acceptance.date": "Termos de Serviço",
      "tos_acceptance.ip": "IP dos Termos",
    };

    return translations[label] || label.split('.').pop()?.replace(/_/g, ' ') || label;
  };

  return (
    <div className="space-y-3">
      <div className="mb-6">
        <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-4">Pendências Ativas</h5>
      </div>

      {allItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelectRequirement(item.id)}
          className={cn(
            "w-full p-5 rounded-2xl border transition-all duration-300 text-left group relative overflow-hidden",
            activeRequirement === item.id
              ? "bg-white dark:bg-white/10 border-zinc-900/20 dark:border-white/20 shadow-xl scale-[1.02] z-20"
              : "bg-transparent border-zinc-100 dark:border-white/5 hover:border-zinc-200 dark:hover:border-white/10"
          )}
        >
          <div className="flex items-start gap-4 relative z-10">
            <div className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
              item.status === 'critical' ? "bg-red-50 dark:bg-red-500/10" :
                item.status === 'due' ? "bg-amber-50 dark:bg-amber-500/10" :
                  "bg-blue-50 dark:bg-blue-500/10"
            )}>
              {getStatusIcon(item.status)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-tight truncate",
                  activeRequirement === item.id ? "text-zinc-900 dark:text-white" : "text-zinc-600 dark:text-zinc-400"
                )}>
                  {formatLabel(item.label)}
                </span>
                <ChevronRight className={cn(
                  "w-3 h-3 transition-transform",
                  activeRequirement === item.id ? "translate-x-0.5 text-zinc-900 dark:text-white" : "text-zinc-300"
                )} />
              </div>
              <p className="text-[8px] font-medium text-zinc-400 uppercase tracking-widest">
                {item.status === 'critical' ? 'Ação Urgente' : item.status === 'due' ? 'Pendente' : 'Em Análise'}
              </p>
            </div>
          </div>

          {activeRequirement === item.id && (
            <motion.div
              layoutId="requirement-indicator"
              className="absolute inset-y-0 left-0 w-1 bg-zinc-900 dark:bg-white rounded-full"
            />
          )}
        </button>
      ))}
    </div>
  );
};