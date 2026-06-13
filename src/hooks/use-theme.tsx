import { useUserPreferences, type UserThemePreference } from '@/hooks/use-user-preferences';
import { useTheme as useNextTheme } from 'next-themes';
import { useCallback, useEffect, useState } from 'react';

export function useTheme() {
  const { theme: currentPreference, setTheme: setNextTheme, resolvedTheme } = useNextTheme();
  const { preferences, updatePreferences } = useUserPreferences();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !preferences?.theme) return;
    if (currentPreference !== preferences.theme) {
      setNextTheme(preferences.theme);
    }
  }, [currentPreference, mounted, preferences?.theme, setNextTheme]);

  const setTheme = useCallback((theme: UserThemePreference | string) => {
    const normalized: UserThemePreference = theme === 'light' || theme === 'dark' || theme === 'system'
      ? theme
      : 'system';

    setNextTheme(normalized);
    if (preferences) {
      void updatePreferences({ theme: normalized }).catch((error) => {
        console.error('[Theme] Não foi possível persistir a preferência.', error);
      });
    }
  }, [preferences, setNextTheme, updatePreferences]);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  const safeTheme = mounted ? (resolvedTheme as 'dark' | 'light') : 'dark';

  return {
    theme: safeTheme,
    preferenceTheme: preferences?.theme || currentPreference || 'system',
    toggleTheme,
    setTheme,
    mounted,
  };
}
