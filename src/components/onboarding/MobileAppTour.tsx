"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Hand,
  Smartphone,
  Sparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MOBILE_TOUR_STEPS, type TourStep } from "./tour-content";

interface MobileAppTourProps {
  open: boolean;
  onComplete: () => void;
}

const TARGET_PADDING = 9;
const SWIPE_THRESHOLD = 72;

const MobileTourCard = ({
  step,
  index,
  total,
  isLast,
  targetMissing,
  onBack,
  onNext,
  onClose,
}: {
  step: TourStep;
  index: number;
  total: number;
  isLast: boolean;
  targetMissing: boolean;
  onBack: () => void;
  onNext: () => void;
  onClose: () => void;
}) => {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      key={step.id}
      drag={reducedMotion ? false : "x"}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.18}
      onDragEnd={(_, info) => {
        if (info.offset.x <= -SWIPE_THRESHOLD) onNext();
        if (info.offset.x >= SWIPE_THRESHOLD && index > 0) onBack();
      }}
      initial={reducedMotion ? false : { opacity: 0, y: 34, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reducedMotion ? undefined : { opacity: 0, x: -36, scale: 0.98 }}
      transition={{ duration: reducedMotion ? 0 : 0.26, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-[28px] border border-black/[0.07] bg-white/96 text-zinc-950 shadow-[0_28px_90px_-24px_rgba(0,0,0,0.7)] backdrop-blur-2xl dark:border-white/[0.11] dark:bg-[#09090a]/96 dark:text-white"
      role="dialog"
      aria-modal="true"
      aria-label={`Tour mobile: ${step.title}`}
    >
      <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-zinc-950/12 dark:bg-white/15" />
      <div className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-black/16 to-transparent dark:via-white/20" />

      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.045] text-black/45 active:scale-95 dark:bg-white/[0.055] dark:text-white/45"
        aria-label="Encerrar tour"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="px-5 pb-5 pt-4">
        <div className="flex items-start gap-3.5 pr-9">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
            {isLast ? <Check className="h-5 w-5" strokeWidth={3} /> : <Smartphone className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-white/38">
              {step.eyebrow} · {index + 1}/{total}
            </p>
            <h3 className="mt-1.5 text-[1.28rem] font-black leading-[0.98] tracking-[-0.045em]">
              {step.title}
            </h3>
          </div>
        </div>

        <p className="mt-4 text-[13px] font-medium leading-relaxed text-zinc-600 dark:text-white/55">
          {step.description}
        </p>

        {step.hint ? (
          <div className="mt-3.5 flex items-center gap-2 rounded-[15px] border border-zinc-200/80 bg-zinc-50/80 px-3 py-2.5 text-[9px] font-bold text-zinc-500 dark:border-white/10 dark:bg-white/[0.045] dark:text-white/42">
            <Hand className="h-4 w-4 shrink-0" />
            {step.hint}
          </div>
        ) : null}

        {targetMissing && step.layout !== "modal" ? (
          <p className="mt-3 text-[9px] font-bold text-amber-600 dark:text-amber-300">
            Esta área ainda está carregando. O tour continuará sem bloquear o uso.
          </p>
        ) : null}

        <div className="mt-4 flex items-center gap-1" aria-label="Progresso do tour">
          {MOBILE_TOUR_STEPS.map((item, itemIndex) => (
            <span
              key={item.id}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                itemIndex === index
                  ? "w-7 bg-zinc-950 dark:bg-white"
                  : itemIndex < index
                    ? "w-1.5 bg-zinc-950/35 dark:bg-white/35"
                    : "w-1.5 bg-zinc-950/10 dark:bg-white/10",
              )}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2.5">
          {index > 0 ? (
            <button
              type="button"
              onClick={onBack}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border border-zinc-200 bg-zinc-50 text-zinc-700 active:scale-95 dark:border-white/10 dark:bg-white/[0.045] dark:text-white/70"
              aria-label="Voltar uma etapa"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : null}

          <Button
            type="button"
            onClick={onNext}
            className="h-12 flex-1 rounded-[16px] bg-zinc-950 text-[9px] font-black uppercase tracking-[0.17em] text-white active:scale-[0.98] dark:bg-white dark:text-zinc-950"
          >
            {isLast ? "Começar a usar" : "Próximo"}
            {!isLast ? <ChevronRight className="ml-1.5 h-4 w-4" /> : <Sparkles className="ml-1.5 h-4 w-4" />}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export const MobileAppTour = ({ open, onComplete }: MobileAppTourProps) => {
  const [active, setActive] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [targetMissing, setTargetMissing] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();

  const step = MOBILE_TOUR_STEPS[currentIndex];
  const isLast = currentIndex === MOBILE_TOUR_STEPS.length - 1;
  const isModal = step?.layout === "modal" || !step?.targetSelector;

  const giveHapticFeedback = () => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(8);
  };

  const goToStep = useCallback(
    (index: number) => {
      const bounded = Math.min(Math.max(index, 0), MOBILE_TOUR_STEPS.length - 1);
      const nextStep = MOBILE_TOUR_STEPS[bounded];
      if (nextStep.expectedRoute && location.pathname !== nextStep.expectedRoute) {
        navigate(nextStep.expectedRoute);
      }
      giveHapticFeedback();
      setCurrentIndex(bounded);
    },
    [location.pathname, navigate],
  );

  const finish = useCallback(() => {
    confetti({
      particleCount: 54,
      spread: 46,
      origin: { y: 0.76 },
      colors: ["#ffffff", "#d4d4d8", "#71717a", "#18181b"],
      disableForReducedMotion: true,
    });
    giveHapticFeedback();
    onComplete();
  }, [onComplete]);

  const next = useCallback(() => {
    if (isLast) finish();
    else goToStep(currentIndex + 1);
  }, [currentIndex, finish, goToStep, isLast]);

  const back = useCallback(() => {
    if (currentIndex > 0) goToStep(currentIndex - 1);
  }, [currentIndex, goToStep]);

  useEffect(() => {
    if (!open) {
      setActive(false);
      setCurrentIndex(0);
      setRect(null);
      return;
    }
    const timer = window.setTimeout(() => setActive(true), 70);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open || !step?.expectedRoute || location.pathname === step.expectedRoute) return;
    navigate(step.expectedRoute, { replace: false });
  }, [location.pathname, navigate, open, step]);

  useLayoutEffect(() => {
    if (!open || !active || isModal || !step?.targetSelector) {
      setRect(null);
      setTargetMissing(false);
      return;
    }

    let attempts = 0;
    let resizeObserver: ResizeObserver | null = null;
    let observedElement: Element | null = null;

    const sync = () => {
      const target = document.querySelector(step.targetSelector!);
      if (!target) {
        attempts += 1;
        setRect(null);
        setTargetMissing(attempts > 7);
        return;
      }

      attempts = 0;
      setTargetMissing(false);
      setRect(target.getBoundingClientRect());
      target.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "center",
        inline: "nearest",
      });

      if (observedElement !== target) {
        resizeObserver?.disconnect();
        observedElement = target;
        resizeObserver = new ResizeObserver(sync);
        resizeObserver.observe(target);
      }
    };

    const initialTimer = window.setTimeout(sync, 180);
    const retryTimer = window.setInterval(sync, 430);
    const mutationObserver = new MutationObserver(sync);
    mutationObserver.observe(document.body, { childList: true, subtree: true, attributes: true });
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    window.addEventListener("scroll", sync, true);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(retryTimer);
      mutationObserver.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
      window.removeEventListener("scroll", sync, true);
    };
  }, [active, currentIndex, isModal, location.pathname, open, reducedMotion, step]);

  const overlayPath = useMemo(() => {
    if (typeof window === "undefined") return "";
    const width = window.innerWidth;
    const height = window.innerHeight;
    const full = `M 0 0 H ${width} V ${height} H 0 Z`;
    if (!rect || isModal) return full;

    const x = Math.max(0, rect.left - TARGET_PADDING);
    const y = Math.max(0, rect.top - TARGET_PADDING);
    const w = Math.min(width - x, rect.width + TARGET_PADDING * 2);
    const h = Math.min(height - y, rect.height + TARGET_PADDING * 2);
    const radius = Math.min(20, Math.max(10, Math.min(w, h) / 4));
    const hole = `M ${x + radius} ${y} H ${x + w - radius} A ${radius} ${radius} 0 0 1 ${x + w} ${y + radius} V ${y + h - radius} A ${radius} ${radius} 0 0 1 ${x + w - radius} ${y + h} H ${x + radius} A ${radius} ${radius} 0 0 1 ${x} ${y + h - radius} V ${y + radius} A ${radius} ${radius} 0 0 1 ${x + radius} ${y} Z`;
    return `${full} ${hole}`;
  }, [isModal, rect]);

  if (!open || !active || !step) return null;

  return (
    <div className="fixed inset-0 z-[10050] select-none overflow-hidden" data-tour-platform="mobile">
      <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
        <motion.path
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1, fill: isModal ? "rgba(0,0,0,0.72)" : "rgba(0,0,0,0.58)" }}
          d={overlayPath}
          fillRule="evenodd"
          transition={{ duration: reducedMotion ? 0 : 0.22 }}
        />
      </svg>

      {rect && !isModal ? (
        <motion.div
          className="pointer-events-none fixed z-[10051] rounded-[20px] ring-2 ring-white/80 shadow-[0_0_0_5px_rgba(255,255,255,0.08),0_0_34px_rgba(255,255,255,0.24)]"
          animate={{
            left: rect.left - TARGET_PADDING,
            top: rect.top - TARGET_PADDING,
            width: rect.width + TARGET_PADDING * 2,
            height: rect.height + TARGET_PADDING * 2,
          }}
          transition={{ duration: reducedMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
        />
      ) : null}

      <div
        className={cn(
          "fixed left-3 right-3 z-[10052] mx-auto max-w-[430px]",
          isModal
            ? "bottom-[calc(0.8rem+env(safe-area-inset-bottom))]"
            : "bottom-[calc(5.25rem+env(safe-area-inset-bottom))]",
        )}
      >
        <AnimatePresence mode="wait">
          <MobileTourCard
            step={step}
            index={currentIndex}
            total={MOBILE_TOUR_STEPS.length}
            isLast={isLast}
            targetMissing={targetMissing}
            onBack={back}
            onNext={next}
            onClose={onComplete}
          />
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MobileAppTour;
