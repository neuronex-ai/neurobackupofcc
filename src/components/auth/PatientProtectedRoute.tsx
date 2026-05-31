import { useAuth } from './SessionContextProvider';
import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { PatientLayout } from '../layout/PatientLayout';

interface PatientProtectedRouteProps {
  children: ReactNode;
}

export const PatientProtectedRoute = ({ children }: PatientProtectedRouteProps) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null; 
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Nota: Não verificamos se o usuário é um "paciente" aqui,
  // apenas se ele está autenticado. A página PatientPortal fará a verificação
  // se o email dele corresponde a um registro na tabela `patients`.

  return (
    <PatientLayout>
      {children}
    </PatientLayout>
  );
};