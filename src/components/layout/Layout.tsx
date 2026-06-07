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
      "min-h-screen flex flex-col relative",
      "bg-zinc-10 dark:bg-zinc-950"
    )}>
      {/* Camada de gradiente base */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-zinc-100/20 to-transparent dark:via-zinc-900/10 pointer-events-none" />

      {!isMobile && <Navbar />}
      <main className={cn(
        "flex-1 transition-all duration-300 relative z-10",
        !isMobile && "pt-20 pb-12",
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