"use client";

import React from "react";
import { Navbar } from "./Navbar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { DevBanner } from "@/components/ui/DevBanner";
import { AppTour } from "@/components/onboarding/AppTour";
import { useTour } from "@/components/onboarding/TourContext";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const isMobile = useIsMobile();
  const { isTourOpen, completeTour } = useTour();

  return (
    <div className={cn(
      "desktop-page-canvas relative flex min-h-screen flex-col",
      isMobile && "bg-background"
    )}>
      {!isMobile && <Navbar />}
      <main className={cn(
        "relative z-10 flex-1 transition-all duration-300",
        !isMobile && "pb-12 pt-20",
        isMobile && "pt-0",
      )}>
        {children}
      </main>
      <DevBanner />

      {/* Global Tour Overlay */}
      <AppTour open={isTourOpen} onComplete={completeTour} />
    </div>
  );
};

export default Layout;
