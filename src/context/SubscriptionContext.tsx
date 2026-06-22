import { createContext, useContext, ReactNode } from "react";
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan";
import {
    SubscriptionPlan,
    SubscriptionStatus,
    PlanFeatures,
    FeatureKey
} from "@/types/subscription";

interface SubscriptionContextValue {
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    features: PlanFeatures;
    isLoading: boolean;
    isDevAccount: boolean;
    isTrial: boolean;
    isTrialExpired: boolean;
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
