import { useAuth } from '@/components/auth/SessionContextProvider';
import { TotpMfaDialog } from '@/components/settings/TotpMfaDialog';
import { getAccountAssurance } from '@/hooks/use-account-security';
import { useEffect, useState } from 'react';
import { UserPreferencesRuntime } from './UserPreferencesRuntime';

export const SessionAssuranceOverlay = () => {
  const { session, user, signOut } = useAuth();
  const [required, setRequired] = useState(false);
  const refresh = async () => {
    if (!session || !user) return setRequired(false);
    const result = await getAccountAssurance();
    if (!result.error) setRequired(result.data.nextLevel === 'aal2' && result.data.currentLevel !== 'aal2');
  };
  useEffect(() => { void refresh(); }, [session?.access_token, user?.id]);
  return <><UserPreferencesRuntime />{required && window.location.pathname !== '/auth' ? <TotpMfaDialog open mode="challenge" onOpenChange={() => undefined} onSuccess={refresh} onCancel={signOut} /> : null}</>;
};
