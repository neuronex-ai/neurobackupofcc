"use client";

import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Info,
  Loader2,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { MobileLayout } from "./MobileLayout";

export interface MobilePageScaffoldProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  showNavigation?: boolean;
  showBottomNavigation?: boolean;
  immersive?: boolean;
}

export const MobilePageScaffold = ({
  children,
  className,
  contentClassName,
  showNavigation = true,
  showBottomNavigation = true,
  immersive = false,
}: MobilePageScaffoldProps) => {
  const navigationVisible = immersive ? false : showNavigation;
  const bottomNavigationVisible = immersive ? false : showBottomNavigation;

  return (
    <MobileLayout
      showNav={navigationVisible}
      showBottomNav={bottomNavigationVisible}
      className={cn("min-h-screen bg-background", className)}
    >
      <div
        className={cn(
          "h-full overflow-y-auto overscroll-y-contain px-5",
          navigationVisible
            ? "pb-[calc(8rem+env(safe-area-inset-bottom))]"
            : "pb-[calc(1.5rem+env(safe-area-inset-bottom))]",
          contentClassName,
        )}
      >
        {children}
      </div>
    </MobileLayout>
  );
};

interface MobilePageHeaderProps {
  title: string;
  eyebrow?: string;
  description?: string;
  leading?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export const MobilePageHeader = ({
  title,
  eyebrow,
  description,
  leading,
  actions,
  className,
}: MobilePageHeaderProps) => (
  <header className={cn("flex items-start justify-between gap-4 pb-6 pt-4", className)}>
    <div className="flex min-w-0 items-start gap-3">
      {leading ? <div className="shrink-0">{leading}</div> : null}
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-muted-foreground/65">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 text-[2rem] font-black leading-[0.92] tracking-[-0.055em] text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-[21rem] text-[13px] font-medium leading-relaxed text-muted-foreground/72">
            {description}
          </p>
        ) : null}
      </div>
    </div>
    {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
  </header>
);

interface MobileSectionHeaderProps {
  title: string;
  eyebrow?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const MobileSectionHeader = ({
  title,
  eyebrow,
  description,
  action,
  className,
}: MobileSectionHeaderProps) => (
  <div className={cn("flex items-end justify-between gap-4", className)}>
    <div className="min-w-0">
      {eyebrow ? (
        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/55">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-1 text-lg font-black tracking-[-0.035em] text-foreground">{title}</h2>
      {description ? (
        <p className="mt-2 text-xs font-medium leading-relaxed text-muted-foreground/68">{description}</p>
      ) : null}
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </div>
);

export interface MobileSegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
  badge?: string | number;
}

interface MobileSegmentedControlProps<T extends string> {
  value: T;
  options: MobileSegmentedOption<T>[];
  onValueChange: (value: T) => void;
  className?: string;
  ariaLabel: string;
}

export const MobileSegmentedControl = <T extends string>({
  value,
  options,
  onValueChange,
  className,
  ariaLabel,
}: MobileSegmentedControlProps<T>) => (
  <div
    role="tablist"
    aria-label={ariaLabel}
    className={cn(
      "grid gap-1 rounded-[20px] border border-border/45 bg-foreground/[0.035] p-1 dark:border-white/10 dark:bg-white/[0.035]",
      className,
    )}
    style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
  >
    {options.map((option) => {
      const Icon = option.icon;
      const active = option.value === value;

      return (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => onValueChange(option.value)}
          className={cn(
            "flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-[15px] px-3 text-[9px] font-black uppercase tracking-[0.12em] transition-all active:scale-[0.98]",
            active
              ? "bg-foreground text-background shadow-sm"
              : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground dark:hover:bg-white/[0.05]",
          )}
        >
          {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" /> : null}
          <span className="truncate">{option.label}</span>
          {option.badge !== undefined ? (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[8px]",
                active ? "bg-background/15 text-background" : "bg-foreground/[0.06] text-muted-foreground",
              )}
            >
              {option.badge}
            </span>
          ) : null}
        </button>
      );
    })}
  </div>
);

type MobileStatusVariant = "info" | "success" | "warning" | "error";

const statusStyles: Record<MobileStatusVariant, { icon: LucideIcon; className: string }> = {
  info: {
    icon: Info,
    className: "border-blue-500/20 bg-blue-500/[0.08] text-blue-700 dark:text-blue-300",
  },
  success: {
    icon: CheckCircle2,
    className: "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-700 dark:text-emerald-300",
  },
  warning: {
    icon: TriangleAlert,
    className: "border-amber-500/20 bg-amber-500/[0.08] text-amber-700 dark:text-amber-300",
  },
  error: {
    icon: AlertCircle,
    className: "border-red-500/20 bg-red-500/[0.08] text-red-700 dark:text-red-300",
  },
};

interface MobileStatusBannerProps {
  title: string;
  description?: string;
  variant?: MobileStatusVariant;
  action?: ReactNode;
  className?: string;
}

export const MobileStatusBanner = ({
  title,
  description,
  variant = "info",
  action,
  className,
}: MobileStatusBannerProps) => {
  const config = statusStyles[variant];
  const Icon = config.icon;

  return (
    <div className={cn("rounded-[22px] border p-4", config.className, className)}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black tracking-[-0.01em]">{title}</p>
          {description ? <p className="mt-1.5 text-[11px] font-medium leading-relaxed opacity-75">{description}</p> : null}
          {action ? <div className="mt-3">{action}</div> : null}
        </div>
      </div>
    </div>
  );
};

interface MobileEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export const MobileEmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}: MobileEmptyStateProps) => (
  <div className={cn("flex min-h-[320px] flex-col items-center justify-center px-6 text-center", className)}>
    <div className="flex h-20 w-20 items-center justify-center rounded-[26px] border border-border/40 bg-foreground/[0.035] dark:border-white/10 dark:bg-white/[0.035]">
      <Icon className="h-8 w-8 text-muted-foreground/50" />
    </div>
    <h3 className="mt-6 text-xl font-black tracking-[-0.04em] text-foreground">{title}</h3>
    <p className="mt-3 max-w-[18rem] text-sm font-medium leading-relaxed text-muted-foreground/68">{description}</p>
    {action ? <div className="mt-6">{action}</div> : null}
  </div>
);

interface MobileErrorStateProps {
  title?: string;
  description: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export const MobileErrorState = ({
  title = "Não foi possível carregar",
  description,
  onRetry,
  retryLabel = "Tentar novamente",
  className,
}: MobileErrorStateProps) => (
  <div className={cn("flex min-h-[320px] flex-col items-center justify-center px-6 text-center", className)}>
    <div className="flex h-20 w-20 items-center justify-center rounded-[26px] border border-red-500/20 bg-red-500/[0.08]">
      <AlertCircle className="h-8 w-8 text-red-500" />
    </div>
    <h3 className="mt-6 text-xl font-black tracking-[-0.04em] text-foreground">{title}</h3>
    <p className="mt-3 max-w-[19rem] text-sm font-medium leading-relaxed text-muted-foreground/68">{description}</p>
    {onRetry ? (
      <Button onClick={onRetry} variant="outline" className="mt-6 h-12 rounded-2xl px-6 text-[9px] font-black uppercase tracking-[0.16em]">
        <RefreshCw className="mr-2 h-4 w-4" />
        {retryLabel}
      </Button>
    ) : null}
  </div>
);

interface MobileSkeletonCardProps {
  lines?: number;
  className?: string;
}

export const MobileSkeletonCard = ({ lines = 3, className }: MobileSkeletonCardProps) => (
  <div className={cn("rounded-[26px] border border-border/35 bg-card/75 p-5 dark:border-white/10 dark:bg-white/[0.03]", className)}>
    <div className="flex items-center gap-3">
      <Skeleton className="h-11 w-11 rounded-2xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-2/5" />
        <Skeleton className="h-5 w-3/4" />
      </div>
    </div>
    <div className="mt-5 space-y-3">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} className={cn("h-3", index === lines - 1 ? "w-3/5" : "w-full")} />
      ))}
    </div>
  </div>
);

interface MobileStickyActionsProps {
  children: ReactNode;
  className?: string;
  aboveBottomNavigation?: boolean;
}

export const MobileStickyActions = ({
  children,
  className,
  aboveBottomNavigation = true,
}: MobileStickyActionsProps) => (
  <div
    className={cn(
      "fixed left-0 right-0 z-[85] border-t border-border/45 bg-background/90 px-5 pt-3 backdrop-blur-2xl dark:border-white/10",
      aboveBottomNavigation
        ? "bottom-[calc(5.5rem+env(safe-area-inset-bottom))] pb-3"
        : "bottom-0 pb-[calc(0.75rem+env(safe-area-inset-bottom))]",
      className,
    )}
  >
    <div className="mx-auto flex max-w-lg items-center gap-3">{children}</div>
  </div>
);

interface MobileActionListItemProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  status?: string;
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  trailing?: ReactNode;
  className?: string;
}

export const MobileActionListItem = ({
  icon: Icon,
  title,
  description,
  status,
  onClick,
  disabled = false,
  destructive = false,
  trailing,
  className,
}: MobileActionListItemProps) => {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      disabled={onClick ? disabled : undefined}
      className={cn(
        "flex w-full items-center gap-4 rounded-[24px] border border-border/40 bg-card/75 p-4 text-left transition-all dark:border-white/10 dark:bg-white/[0.03]",
        onClick && "active:scale-[0.985] hover:bg-foreground/[0.035] dark:hover:bg-white/[0.05]",
        disabled && "cursor-not-allowed opacity-45",
        destructive && "border-red-500/20 bg-red-500/[0.05]",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-foreground/[0.045] text-muted-foreground",
          destructive && "bg-red-500/10 text-red-500",
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={cn("truncate text-sm font-black tracking-[-0.015em] text-foreground", destructive && "text-red-500")}>{title}</p>
          {status ? (
            <span className="shrink-0 rounded-full bg-foreground/[0.055] px-2 py-1 text-[7px] font-black uppercase tracking-[0.13em] text-muted-foreground">
              {status}
            </span>
          ) : null}
        </div>
        {description ? <p className="mt-1 line-clamp-2 text-[11px] font-medium leading-relaxed text-muted-foreground/68">{description}</p> : null}
      </div>
      {trailing || (onClick ? <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/35" /> : null)}
    </Component>
  );
};

interface MobileLoadingStateProps {
  label?: string;
  className?: string;
}

export const MobileLoadingState = ({ label = "Carregando", className }: MobileLoadingStateProps) => (
  <div className={cn("flex min-h-[280px] flex-col items-center justify-center gap-4", className)}>
    <Loader2 className="h-7 w-7 animate-spin text-muted-foreground/35" />
    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/55">{label}</p>
  </div>
);
