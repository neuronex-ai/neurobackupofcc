import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { usePatientPortalCurrent } from "@/hooks/use-patient-portal";
import { isPatientAccount } from "@/lib/auth-account-role";
import { useAuth } from "./SessionContextProvider";

interface PatientProtectedRouteProps {
  children: ReactNode;
}

export const PatientProtectedRoute = ({ children }: PatientProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const portal = usePatientPortalCurrent();

  if (isLoading) return null;
  if (!user) {
    const token = new URLSearchParams(location.search).get("token");
    if (token) window.localStorage.setItem("neuronex_patient_portal_invite_token", token);
    return <Navigate to="/auth?role=patient" replace />;
  }

  if (portal.isLoading) return null;

  const portalStatus = portal.data?.status;
  const hasPatientRole = isPatientAccount(user);
  const hasPortalLink = Boolean(portal.data?.linkId);

  if (!hasPatientRole && !hasPortalLink) return <Navigate to="/dashboard" replace />;
  if (portalStatus === "active" && location.pathname.startsWith("/portal/ativar")) {
    window.localStorage.removeItem("neuronex_patient_portal_invite_token");
    return <Navigate to="/portal" replace />;
  }

  return <>{children}</>;
};
