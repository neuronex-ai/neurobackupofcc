import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/SessionContextProvider";
import {
    SubscriptionPlan,
    SubscriptionStatus,
    PlanFeatures,
    PLAN_FEATURES,
    FeatureKey
} from "@/types/subscription";

// Developer accounts with full access
const DEV_ACCOUNTS = ['jotahub@gmail.com'];

interface SubscriptionData {
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    features: PlanFeatures;
    isDevAccount: boolean;
    subscriptionId?: string;
    currentPeriodEnd?: Date;
}

interface UseSubscriptionPlanReturn {
    data: SubscriptionData | undefined;
    isLoading: boolean;
    error: Error | null;
    canAccess: (feature: FeatureKey) => boolean;
    canAddPatient: (currentPatientCount: number) => boolean;
    refetch: () => void;
}

export const useSubscriptionPlan = (): UseSubscriptionPlanReturn => {
    const { user, isLoading: isAuthLoading } = useAuth();

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['user-subscription', user?.id],
        queryFn: async (): Promise<SubscriptionData> => {
            if (!user) {
                throw new Error('User not authenticated');
            }

            // Developer bypass
            if (user.email && DEV_ACCOUNTS.includes(user.email)) {
                return {
                    plan: 'Enterprise',
                    status: 'active',
                    features: PLAN_FEATURES.Enterprise,
                    isDevAccount: true,
                };
            }

            const { data: subscription, error } = await supabase
                .from('user_subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (error) throw error;

            // Default to Essential if no subscription found
            if (!subscription) {
                return {
                    plan: 'Essential',
                    status: 'active',
                    features: PLAN_FEATURES.Essential,
                    isDevAccount: false,
                };
            }

            const plan = (subscription.plan as SubscriptionPlan) || 'Essential';
            const status = (subscription.status as SubscriptionStatus) || 'inactive';

            return {
                plan,
                status,
                features: PLAN_FEATURES[plan],
                isDevAccount: false,
                subscriptionId: subscription.asaas_subscription_id || subscription.id,
                currentPeriodEnd: subscription.current_period_end
                    ? new Date(subscription.current_period_end)
                    : undefined,
            };
        },
        enabled: !!user && !isAuthLoading,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes
    });

    const canAccess = (feature: FeatureKey): boolean => {
        if (!data) return false;
        if (data.isDevAccount) return true;
        if (data.status !== 'active' && data.status !== 'trialing') return false;

        const featureMap: Record<FeatureKey, keyof PlanFeatures | 'maxPatients'> = {
            ai_copilot: 'hasAICopilot',
            telemedicine: 'hasTelemedicine',
            advanced_finance: 'hasAdvancedFinance',
            patient_portal: 'hasPatientPortal',
            multiple_professionals: 'hasMultipleProfessionals',
            admin_dashboard: 'hasAdminDashboard',
            performance_reports: 'hasPerformanceReports',
            api_access: 'hasAPIAccess',
            unlimited_patients: 'maxPatients',
        };

        const featureKey = featureMap[feature];
        if (featureKey === 'maxPatients') {
            return data.features.maxPatients === 'unlimited';
        }

        return data.features[featureKey as keyof PlanFeatures] as boolean;
    };

    const canAddPatient = (currentPatientCount: number): boolean => {
        if (!data) return false;
        if (data.isDevAccount) return true;
        if (data.status !== 'active' && data.status !== 'trialing') return false;

        const maxPatients = data.features.maxPatients;
        if (maxPatients === 'unlimited') return true;

        return currentPatientCount < maxPatients;
    };

    return {
        data,
        isLoading: isLoading || isAuthLoading,
        error: error as Error | null,
        canAccess,
        canAddPatient,
        refetch,
    };
};
