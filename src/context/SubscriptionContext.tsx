import { createContext, useContext, ReactNode } from "react";
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan";
import {
    SubscriptionPlan,
    SubscriptionStatus,
    SubscriptionAccessState,
    PlanFeatures,
    FeatureKey
} from "@/types/subscription";

interface SubscriptionContextValue {
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    accessState: SubscriptionAccessState;
    features: PlanFeatures;
    isLoading: boolean;
    isDevAccount: boolean;
    isTrial: boolean;
    isTrialExpired: boolean;
    hasPaidAccess: boolean;
    canUseCurrentAccess: boolean;
    requiresUpsell: boolean;
    checkoutUrl?: string;
    message?: string;
    trialEndsAt?: Date;
    daysUntilTrialEnds?: number;
    canAccess: (feature: FeatureKey) => boolean;
    canAddPatient: (currentPatientCount: number) => boolean;
    refreshSubscription: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

interface SubscriptionProviderProps {
    children: ReactNode;
}

export const SubscriptionProvider = ({ children }: SubscriptionProviderProps) => {
    const { data, isLoading, canAccess, canAddPatient, refetch } = useSubscriptionPlan();

    const value: SubscriptionContextValue = {
        plan: data?.plan || 'Essential',
        status: data?.status || 'inactive',
        accessState: data?.accessState || 'blocked',
        features: data?.features || {
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
        isLoading,
        isDevAccount: data?.isDevAccount || false,
        isTrial: data?.isTrial || false,
        isTrialExpired: data?.isTrialExpired || false,
        hasPaidAccess: data?.hasPaidAccess || false,
        canUseCurrentAccess: data?.canUseCurrentAccess || false,
        requiresUpsell: data?.requiresUpsell || false,
        checkoutUrl: data?.checkoutUrl,
        message: data?.message,
        trialEndsAt: data?.trialEndsAt,
        daysUntilTrialEnds: data?.daysUntilTrialEnds,
        canAccess,
        canAddPatient,
        refreshSubscription: refetch,
    };

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
};

export const useSubscription = (): SubscriptionContextValue => {
    const context = useContext(SubscriptionContext);
    if (context === undefined) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
};
