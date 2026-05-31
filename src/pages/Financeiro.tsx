import { Suspense, lazy } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Loader2 } from "lucide-react";
import { FeatureGate, LockedFeatureScreen } from "@/components/subscription";

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

const Financeiro = () => {
    return (
        <FeatureGate
            feature="advanced_finance"
            fallback={
                <LockedFeatureScreen
                    feature="advanced_finance"
                    title="NeuroFinance"
                    description="Gestão financeira completa com conta digital, cobranças PIX/Boleto/Cartão, recorrência, fluxo de caixa e relatórios avançados. Disponível a partir do plano Professional."
                />
            }
        >
            <FinanceiroCore />
        </FeatureGate>
    );
};

export default Financeiro;