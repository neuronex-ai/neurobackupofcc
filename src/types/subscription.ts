/** 
 * Níveis de plano de assinatura que definem limites e funcionalidades disponíveis.
 */
export type SubscriptionPlan = 'Essential' | 'Professional' | 'Enterprise';

/** 
 * Status operacionais de uma assinatura sincronizados com o gateway de pagamento.
 */
export type SubscriptionStatus =
    | 'inactive'
    | 'trialing'
    | 'trial_expired'
    | 'checkout_pending'
    | 'payment_pending'
    | 'active'
    | 'past_due'
    | 'grace_period'
    | 'blocked'
    | 'canceled'
    | 'refunded'
    | 'chargeback'
    | 'admin_override'
    | 'internal_error';

export type SubscriptionAccessState =
    | 'trial_access'
    | 'paid_access'
    | 'limited_access'
    | 'blocked'
    | 'admin_override';

/** 
 * Chaves de funcionalidades para controle de acesso granular e Feature Flags.
 */
export type FeatureKey =
    | 'ai_copilot'
    | 'telemedicine'
    | 'advanced_finance'
    | 'patient_portal'
    | 'multiple_professionals'
    | 'admin_dashboard'
    | 'performance_reports'
    | 'api_access'
    | 'unlimited_patients';

export interface PlanFeatures {
    maxPatients: number | 'unlimited';
    hasAICopilot: boolean;
    hasTelemedicine: boolean;
    hasAdvancedFinance: boolean;
    hasPatientPortal: boolean;
    hasMultipleProfessionals: boolean;
    hasAdminDashboard: boolean;
    hasPerformanceReports: boolean;
    hasAPIAccess: boolean;
}

/**
 * Representa o estado atual da subscrição de um profissional na plataforma.
 */
export interface UserSubscription {
    id: string;
    userId: string;
    /** Plano contratado pelo usuário */
    plan: SubscriptionPlan;
    /** Status de pagamento e vigência da conta */
    status: SubscriptionStatus;
    /** ID da assinatura vinculada ao gateway de pagamento para gestão de faturamento */
    gatewaySubscriptionId?: string;
    /** Data de início do período de cobrança atual */
    currentPeriodStart?: Date;
    /** Data de renovação ou expiração da assinatura atual */
    currentPeriodEnd?: Date;
    createdAt: Date;
}

// Plan configurations
export const PLAN_FEATURES: Record<SubscriptionPlan, PlanFeatures> = {
    Essential: {
        maxPatients: 5,
        hasAICopilot: false,
        hasTelemedicine: false,
        hasAdvancedFinance: false,
        hasPatientPortal: false,
        hasMultipleProfessionals: false,
        hasAdminDashboard: false,
        hasPerformanceReports: false,
        hasAPIAccess: false,
    },
    Professional: {
        maxPatients: 'unlimited',
        hasAICopilot: true,
        hasTelemedicine: true,
        hasAdvancedFinance: true,
        hasPatientPortal: true,
        hasMultipleProfessionals: false,
        hasAdminDashboard: false,
        hasPerformanceReports: false,
        hasAPIAccess: false,
    },
    Enterprise: {
        maxPatients: 'unlimited',
        hasAICopilot: true,
        hasTelemedicine: true,
        hasAdvancedFinance: true,
        hasPatientPortal: true,
        hasMultipleProfessionals: true,
        hasAdminDashboard: true,
        hasPerformanceReports: true,
        hasAPIAccess: true,
    },
};

// Feature to plan mapping for upsell suggestions
export const FEATURE_UPSELL_PLANS: Record<FeatureKey, SubscriptionPlan> = {
    ai_copilot: 'Professional',
    telemedicine: 'Professional',
    advanced_finance: 'Professional',
    patient_portal: 'Professional',
    unlimited_patients: 'Professional',
    multiple_professionals: 'Enterprise',
    admin_dashboard: 'Enterprise',
    performance_reports: 'Enterprise',
    api_access: 'Enterprise',
};

// Human-readable feature names
export const FEATURE_NAMES: Record<FeatureKey, string> = {
    ai_copilot: 'IA Copilot (Synapse AI)',
    telemedicine: 'Telemedicina HD',
    advanced_finance: 'Gestão Financeira Avançada',
    patient_portal: 'Portal do Paciente',
    unlimited_patients: 'Pacientes Ilimitados',
    multiple_professionals: 'Múltiplos Profissionais',
    admin_dashboard: 'Dashboard Administrativo',
    performance_reports: 'Relatórios de Performance',
    api_access: 'API & Integrações',
};
