import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/SessionContextProvider';
import { supabase } from '@/integrations/supabase/client';

const ONBOARDING_STORAGE_KEY = 'neuronex_welcome_onboarding';

export interface OnboardingState {
    currentStep: number;
    completedSteps: number[];
    profileData: {
        firstName: string;
        lastName: string;
        clinic: string;
        crp: string;
        phone: string;
        address: string;
        bio: string;
        specialty: string;
    };
    googleConnected: boolean;
    isComplete: boolean;
}

const initialState: OnboardingState = {
    currentStep: 1,
    completedSteps: [],
    profileData: {
        firstName: '',
        lastName: '',
        clinic: '',
        crp: '',
        phone: '',
        address: '',
        bio: '',
        specialty: '',
    },
    googleConnected: false,
    isComplete: false,
};

export const useWelcomeOnboarding = () => {
    const { user } = useAuth();
    const [state, setState] = useState<OnboardingState>(initialState);
    const [isLoading, setIsLoading] = useState(true);
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        const stored = localStorage.getItem(`${ONBOARDING_STORAGE_KEY}_${user.id}`);
        if (stored) {
            try {
                const parsed = JSON.parse(stored) as OnboardingState;
                setState(parsed);
                setShowOnboarding(!parsed.isComplete);
            } catch {
                setShowOnboarding(true);
            }
        } else {
            setShowOnboarding(true);
        }
        setIsLoading(false);
    }, [user]);

    const persistState = useCallback((newState: OnboardingState) => {
        if (user) {
            localStorage.setItem(`${ONBOARDING_STORAGE_KEY}_${user.id}`, JSON.stringify(newState));
        }
    }, [user]);

    const goToStep = useCallback((step: number) => {
        setState(prev => {
            const newState = { ...prev, currentStep: step };
            persistState(newState);
            return newState;
        });
    }, [persistState]);

    const nextStep = useCallback(() => {
        setState(prev => {
            const newCompletedSteps = prev.completedSteps.includes(prev.currentStep)
                ? prev.completedSteps
                : [...prev.completedSteps, prev.currentStep];

            const newState = {
                ...prev,
                currentStep: prev.currentStep + 1,
                completedSteps: newCompletedSteps,
            };
            persistState(newState);
            return newState;
        });
    }, [persistState]);

    const updateProfileData = useCallback((data: Partial<OnboardingState['profileData']>) => {
        setState(prev => {
            const newState = {
                ...prev,
                profileData: { ...prev.profileData, ...data },
            };
            persistState(newState);
            return newState;
        });
    }, [persistState]);

    const setGoogleConnected = useCallback((connected: boolean) => {
        setState(prev => {
            const newState = { ...prev, googleConnected: connected };
            persistState(newState);
            return newState;
        });
    }, [persistState]);

    const saveProfileToSupabase = useCallback(async () => {
        if (!user) return false;

        try {
            const profileUpdate: Record<string, any> = {};

            if (state.profileData.firstName) {
                profileUpdate.first_name = state.profileData.firstName;
            }
            if (state.profileData.lastName) {
                profileUpdate.last_name = state.profileData.lastName;
            }
            if (state.profileData.clinic) {
                profileUpdate.clinic_name = state.profileData.clinic;
            }
            if (state.profileData.crp) {
                profileUpdate.crp = state.profileData.crp;
            }
            if (state.profileData.phone) {
                profileUpdate.phone = state.profileData.phone;
            }
            if (state.profileData.address) {
                profileUpdate.address = state.profileData.address;
            }
            if (state.profileData.bio) {
                profileUpdate.bio = state.profileData.bio;
            }

            if (Object.keys(profileUpdate).length > 0) {
                const { error } = await supabase
                    .from('profiles')
                    .update(profileUpdate)
                    .eq('id', user.id);

                if (error) {
                    console.error('Error saving profile:', error);
                    return false;
                }
            }

            return true;
        } catch (error) {
            console.error('Error saving profile:', error);
            return false;
        }
    }, [user, state.profileData]);

    const completeOnboarding = useCallback(async () => {
        await saveProfileToSupabase();

        setState(prev => {
            const newState = { ...prev, isComplete: true };
            persistState(newState);
            return newState;
        });
        setShowOnboarding(false);
    }, [saveProfileToSupabase, persistState]);

    const resetOnboarding = useCallback(() => {
        if (user) {
            localStorage.removeItem(`${ONBOARDING_STORAGE_KEY}_${user.id}`);
        }
        setState(initialState);
        setShowOnboarding(true);
    }, [user]);

    return {
        state,
        isLoading,
        showOnboarding,
        goToStep,
        nextStep,
        updateProfileData,
        setGoogleConnected,
        completeOnboarding,
        saveProfileToSupabase,
        resetOnboarding,
    };
};
