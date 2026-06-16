import { SessionAssuranceOverlay } from '@/components/runtime/SessionAssuranceOverlay';
import { SettingsSimplifierRuntime } from '@/components/runtime/SettingsSimplifierRuntime';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Layout } from '../layout/Layout';
import { WelcomeTourModal } from '../layout/WelcomeTourModal';
import { useAuth } from './SessionContextProvider';

interface ProtectedRouteProps { children: ReactNode; isFullScreen?: boolean; }

export const ProtectedRoute = ({ children, isFullScreen = false }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  useUserPreferences();
  if (isLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  const content = <><SettingsSimplifierRuntime /><SessionAssuranceOverlay />{!isFullScreen && <WelcomeTourModal />}{children}</>;
  return isFullScreen ? content : <Layout>{content}</Layout>;
};
