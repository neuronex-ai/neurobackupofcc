"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

type FinanceRouteContext = {
  groupLabel?: string;
  viewLabel?: string;
};

type RouteSegment = {
  label: string;
  href?: string;
  action?: "neurofinance-root";
};

const FINANCE_CONTEXT_STORAGE_KEY = "neuronex.finance.route-context";

function readFinanceContext(): FinanceRouteContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(FINANCE_CONTEXT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function routeSegmentsForPath(pathname: string, financeContext: FinanceRouteContext | null): RouteSegment[] {
  if (pathname.startsWith("/financeiro/neurofinance")) {
    const segments: RouteSegment[] = [
      { label: "Financeiro", href: "/financeiro" },
      { label: "NeuroFinance", href: "/financeiro/neurofinance", action: "neurofinance-root" },
    ];

    if (financeContext?.groupLabel && financeContext.groupLabel !== "Conta e Saldo") {
      segments.push({ label: financeContext.groupLabel });
    }

    if (financeContext?.viewLabel && financeContext.viewLabel !== financeContext.groupLabel) {
      segments.push({ label: financeContext.viewLabel });
    }

    return segments;
  }

  if (pathname.startsWith("/financeiro/gestao")) {
    return [
      { label: "Financeiro", href: "/financeiro" },
      { label: "Gestão Financeira" },
    ];
  }

  if (pathname.startsWith("/financeiro")) return [{ label: "Financeiro" }];
  if (pathname.startsWith("/pacientes/") && pathname.split("/").filter(Boolean).length > 1) {
    return [
      { label: "Pacientes", href: "/pacientes" },
      { label: "Prontuário" },
    ];
  }
  if (pathname.startsWith("/pacientes")) return [{ label: "Pacientes" }];
  if (pathname.startsWith("/agenda")) return [{ label: "Agenda" }];
  if (pathname.startsWith("/teleconsulta")) return [{ label: "Teleconsulta" }];
  if (pathname.startsWith("/notas")) return [{ label: "Notas" }];
  if (pathname.startsWith("/ajustes")) return [{ label: "Ajustes" }];
  if (pathname.startsWith("/synapse-ai")) return [{ label: "Synapse AI" }];
  if (pathname.startsWith("/dashboard")) return [{ label: "Painel" }];

  return [];
}

export function DesktopRoutePill() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const [financeContext, setFinanceContext] = useState<FinanceRouteContext | null>(() => readFinanceContext());

  useEffect(() => {
    const handleFinanceRouteContext = (event: Event) => {
      const detail = (event as CustomEvent<FinanceRouteContext>).detail || null;
      setFinanceContext(detail);
      try {
        window.localStorage.setItem(FINANCE_CONTEXT_STORAGE_KEY, JSON.stringify(detail || {}));
      } catch {
        // Ignore storage errors in restricted environments.
      }
    };

    window.addEventListener("neuronex:finance-route-context", handleFinanceRouteContext);
    return () => window.removeEventListener("neuronex:finance-route-context", handleFinanceRouteContext);
  }, []);

  const segments = useMemo(
    () => routeSegmentsForPath(location.pathname, financeContext),
    [location.pathname, financeContext],
  );

  const visibleSegments = segments.length > 3 ? segments.slice(Math.max(segments.length - 3, 0)) : segments;

  if (isMobile || visibleSegments.length === 0 || location.pathname.startsWith("/auth")) return null;

  const handleSegmentClick = (segment: RouteSegment) => {
    if (!segment.href) return;

    if (segment.action === "neurofinance-root") {
      window.dispatchEvent(new CustomEvent("neuronex:finance-navigate", { detail: { view: "conta-digital" } }));
    }

    navigate(segment.href);
  };

  return (
    <div className="pointer-events-none fixed left-5 top-7 z-[59] hidden max-w-[min(37vw,560px)] xl:block">
      <nav
        aria-label="Localização atual"
        className="pointer-events-auto flex min-h-11 max-w-full items-center gap-1 overflow-hidden rounded-[26px] border border-zinc-200/75 bg-white/72 px-3 py-2 shadow-[0_24px_70px_-48px_rgba(24,24,27,0.50),inset_0_1px_0_rgba(255,255,255,0.82)] ring-1 ring-white/50 backdrop-blur-3xl dark:border-white/[0.085] dark:bg-[#070708]/70 dark:shadow-[0_30px_84px_-54px_rgba(0,0,0,0.98),inset_0_1px_0_rgba(255,255,255,0.055)] dark:ring-white/[0.035]"
      >
        <div className="flex min-w-0 items-center gap-1 overflow-hidden">
          {visibleSegments.map((segment, index) => {
            const isLast = index === visibleSegments.length - 1;
            const isClickable = Boolean(segment.href) && !isLast;

            return (
              <div key={`${segment.label}-${index}`} className="flex min-w-0 items-center gap-1">
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => handleSegmentClick(segment)}
                  className={cn(
                    "min-w-0 truncate rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] transition-all",
                    isLast
                      ? "max-w-[190px] text-zinc-950 dark:text-white"
                      : "max-w-[150px] text-zinc-500 hover:bg-zinc-950/[0.055] hover:text-zinc-950 dark:text-zinc-500 dark:hover:bg-white/[0.07] dark:hover:text-white",
                    !isClickable && !isLast && "cursor-default",
                  )}
                >
                  {segment.label}
                </button>
                {!isLast ? <ChevronRight className="h-3 w-3 shrink-0 text-zinc-300 dark:text-zinc-700" /> : null}
              </div>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
