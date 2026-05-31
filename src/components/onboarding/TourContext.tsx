import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useAuth } from '@/components/auth/SessionContextProvider';

const TOUR_COMPLETED_KEY = 'neuro_nex_tour_completed';

interface TourContextType {
    startTour: () => void;
    isTourOpen: boolean;
    closeTour: () => void;
    completeTour: () => void;
    isTourCompleted: boolean;
    resetTourCompleted: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const useTour = () => {
    const context = useContext(TourContext);
    if (!context) {
        throw new Error('useTour must be used within a TourProvider');
    }
    return context;
};

export const TourProvider = ({ children }: { children: ReactNode }) => {
    const [isTourOpen, setIsTourOpen] = useState(false);
    const [isTourCompleted, setIsTourCompleted] = useState(() => {
        return localStorage.getItem(TOUR_COMPLETED_KEY) === 'true';
    });

    const startTour = useCallback(() => {
        setIsTourOpen(true);
    }, []);

    const closeTour = useCallback(() => {
        setIsTourOpen(false);
    }, []);

    const completeTour = useCallback(() => {
        setIsTourOpen(false);
        setIsTourCompleted(true);
        localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
    }, []);

    const resetTourCompleted = useCallback(() => {
        setIsTourCompleted(false);
        localStorage.removeItem(TOUR_COMPLETED_KEY);
    }, []);

    return (
        <TourContext.Provider value={{ startTour, isTourOpen, closeTour, completeTour, isTourCompleted, resetTourCompleted }}>
            {children}
        </TourContext.Provider>
    );
};
