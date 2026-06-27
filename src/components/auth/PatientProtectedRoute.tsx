import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./SessionContextProvider";

interface PatientProtectedRouteProps {
  children: ReactNode;
}

export const PatientProtectedRoute = ({ children }: PatientProtectedRouteProps) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  return <>{children}</>;
};
