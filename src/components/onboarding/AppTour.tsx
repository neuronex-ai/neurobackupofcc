"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopAppTour } from "./DesktopAppTour";
import { MobileAppTour } from "./MobileAppTour";

interface AppTourProps {
  open: boolean;
  onComplete: () => void;
}

export const AppTour = ({ open, onComplete }: AppTourProps) => {
  const isMobile = useIsMobile();

  return isMobile ? (
    <MobileAppTour open={open} onComplete={onComplete} />
  ) : (
    <DesktopAppTour open={open} onComplete={onComplete} />
  );
};

export default AppTour;
