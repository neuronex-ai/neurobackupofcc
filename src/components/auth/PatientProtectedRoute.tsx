import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./SessionContextProvider";

interface PatientProtectedRouteProps {
  children: ReactNode;
}

export const PatientProtectedRoute = ({ children }: PatientProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null;
  if (!user) {
    const token = new URLSearchParams(location.search).get("token");
    if (token) window.localStorage.setItem("neuronex_patient_portal_invite_token", token);
    return <Navigate to="/auth?role=patient" replace />;
  }

  return <>{children}</>;
};
