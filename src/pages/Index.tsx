import { Suspense, lazy } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { useSmoothScroll } from "@/hooks/use-smooth-scroll";
import { useIsMobile } from "@/hooks/use-mobile";
import { Loader2 } from "lucide-react";

// Lazy load heavy components
const Hero = lazy(() => import("@/components/landing/Hero").then(module => ({ default: module.Hero })));
const EcosystemShowcase = lazy(() => import("@/components/landing/EcosystemShowcase").then(module => ({ default: module.EcosystemShowcase })));
const WaitlistSection = lazy(() => import("@/components/landing/WaitlistSection").then(module => ({ default: module.WaitlistSection })));
const DesktopAppCTA = lazy(() => import("@/components/landing/DesktopAppCTA").then(module => ({ default: module.DesktopAppCTA })));
const Footer = lazy(() => import("@/components/landing/Footer").then(module => ({ default: module.Footer })));
const MobileIndex = lazy(() => import("@/mobile/pages/MobileIndex").then(module => ({ default: module.MobileIndex })));

const LoadingFallback = () => (
  <div className="h-screen w-full flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-foreground/20" />
  </div>
);

const Index = () => {
  useSmoothScroll();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <MobileIndex />
      </Suspense>
    );
  }

  return (
    <div className="neuronex-bg min-h-screen relative overflow-x-hidden font-sans selection:bg-primary/30 selection:text-primary">
      <Navbar />
      <main>
        <Suspense fallback={<LoadingFallback />}>
          <Hero />
          <EcosystemShowcase />
          <WaitlistSection />
          <DesktopAppCTA />
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default Index;