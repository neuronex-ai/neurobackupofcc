"use client";

import { Suspense, lazy } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Loader2 } from "lucide-react";

// Lazy load ONLY the needed version
const DesktopDashboard = lazy(() => import("@/pages/desktop/DesktopDashboard"));
const MobileDashboard = lazy(() => import("@/mobile/pages/MobileDashboard").then(m => ({ default: m.MobileDashboard })));

const PageLoader = () => (
  <div className="h-screen w-full flex items-center justify-center bg-background">
    <div className="relative">
      <div className="absolute inset-0 bg-foreground/10 blur-2xl animate-pulse rounded-full" />
      <Loader2 className="h-8 w-8 animate-spin text-foreground/20 relative z-10" />
    </div>
  </div>
);

const Dashboard = () => {
  const isMobile = useIsMobile();

  return (
    <Suspense fallback={<PageLoader />}>
      {isMobile ? <MobileDashboard /> : <DesktopDashboard />}
    </Suspense>
  );
};

export default Dashboard;