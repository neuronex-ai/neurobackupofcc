import { useCallback, useState } from 'react';
import { useTheme } from 'next-themes';

type ThemeMode = 'light' | 'dark';

/**
 * Hook for managing cinematic theme transitions
 * Creates a smooth "light ascending" or "light descending" effect
 */
export function useThemeTransition() {
    const { theme, setTheme, systemTheme } = useTheme();
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [transitionDirection, setTransitionDirection] = useState<'to-light' | 'to-dark' | null>(null);

    // Determine current effective theme
    const currentTheme = theme === 'system' ? systemTheme : theme;
    const isLight = currentTheme === 'light';

    const transitionTo = useCallback((targetTheme: ThemeMode) => {
        const direction = targetTheme === 'light' ? 'to-light' : 'to-dark';

        setTransitionDirection(direction);
        setIsTransitioning(true);

        const duration = 600; // iOS style fast transition
        const themeChangeDelay = 300; // Switch exactly halfway

        const themeChangeTimeout = setTimeout(() => {
            setTheme(targetTheme);
        }, themeChangeDelay);

        const endTimeout = setTimeout(() => {
            setIsTransitioning(false);
            setTransitionDirection(null);
        }, duration);

        return () => {
            clearTimeout(themeChangeTimeout);
            clearTimeout(endTimeout);
        };
    }, [setTheme]);

    const toggleTheme = useCallback(() => {
        const targetTheme = isLight ? 'dark' : 'light';
        transitionTo(targetTheme);
    }, [isLight, transitionTo]);

    return {
        isTransitioning,
        transitionDirection,
        transitionTo,
        toggleTheme,
        isLight
    };
}
