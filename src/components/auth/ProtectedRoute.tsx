import { useAuth } from './SessionContextProvider';
import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { Layout } from '../layout/Layout';
import { WelcomeTourModal } from '../layout/WelcomeTourModal';

interface ProtectedRouteProps {
  children: ReactNode;
  isFullScreen?: boolean;
}

export const ProtectedRoute = ({ children, isFullScreen = false }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (isFullScreen) {
    return (
      <>
        <WelcomeTourModal />
        {children}
      </>
    );
  }

  return (
    <Layout>
      <WelcomeTourModal />
      {children}
    </Layout>
  );
};