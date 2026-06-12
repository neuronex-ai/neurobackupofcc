import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { useIsMobile } from "@/hooks/use-mobile";

const DesktopFinanceiro = lazy(() => import("@/pages/desktop/DesktopFinanceiro"));
const MobileFinanceiro = lazy(() => import("@/mobile/pages/MobileFinanceiro").then(m => ({ default: m.MobileFinanceiro })));

const PageLoader = () => (
  <div className="h-screen w-full flex items-center justify-center bg-background">
    <div className="relative">
      <div className="absolute inset-0 bg-foreground/10 blur-2xl animate-pulse rounded-full" />
      <Loader2 className="h-8 w-8 animate-spin text-foreground/20 relative z-10" />
    </div>
  </div>
);

const FinanceiroCore = () => {
  const isMobile = useIsMobile();

  return (
    <Suspense fallback={<PageLoader />}>
      {isMobile ? <MobileFinanceiro /> : <DesktopFinanceiro />}
    </Suspense>
  );
};

const Financeiro = () => (
  <Routes>
    <Route index element={<FinanceiroCore />} />
    <Route path="gestao/*" element={<Navigate to="/financeiro" replace />} />
    <Route path="neurofinance/*" element={<FinanceiroCore />} />
    <Route path="*" element={<FinanceiroCore />} />
  </Routes>
);

export default Financeiro;
