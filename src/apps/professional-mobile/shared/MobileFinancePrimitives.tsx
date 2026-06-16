/* eslint-disable react-refresh/only-export-components */
import {
  CheckCircle2,
  ChevronRight,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

export const mobileFinanceSurface =
  "rounded-2xl border border-border/60 bg-card text-card-foreground shadow-sm dark:border-white/10 dark:bg-card/95";

export const mobileFinanceInputClassName =
  "mt-2 h-12 w-full rounded-xl border border-input bg-background px-4 text-base font-medium text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none";

export const formatMoney = (value: number | null | undefined) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));

export const parseMoney = (value: string) => {
  const normalized = value
    .replace(/\s/g, "")
    .replace(/[R$r$]/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

type Tone = "default" | "dark" | "success" | "warning" | "danger";

const interactiveState =
  "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.985] motion-reduce:transition-none motion-reduce:active:scale-100";

const toneStyles: Record<
  Tone,
  { surface: string; icon: string; text: string; muted: string; accent: string }
> = {
  default: {
    surface: mobileFinanceSurface,
    icon: "bg-muted text-muted-foreground",
    text: "text-foreground",
    muted: "text-muted-foreground",
    accent: "text-foreground",
  },
  dark: {
    surface: "rounded-2xl border border-foreground bg-foreground text-background shadow-sm",
    icon: "bg-background/12 text-background",
    text: "text-background",
    muted: "text-background/70",
    accent: "text-background",
  },
  success: {
    surface: cn(mobileFinanceSurface, "border-emerald-500/25"),
    icon: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
    text: "text-foreground",
    muted: "text-muted-foreground",
    accent: "text-emerald-700 dark:text-emerald-300",
  },
  warning: {
    surface: cn(mobileFinanceSurface, "border-amber-500/25"),
    icon: "bg-amber-500/12 text-amber-800 dark:text-amber-200",
    text: "text-foreground",
    muted: "text-muted-foreground",
    accent: "text-amber-800 dark:text-amber-200",
  },
  danger: {
    surface: cn(mobileFinanceSurface, "border-rose-500/25"),
    icon: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
    text: "text-foreground",
    muted: "text-muted-foreground",
    accent: "text-rose-700 dark:text-rose-300",
  },
};

export function MobileEyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-xs font-semibold uppercase text-muted-foreground", className)}>
      {children}
    </p>
  );
}

export function MobilePageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-4 pb-1 pt-1">
      <div className="min-w-0">
        <MobileEyebrow>{eyebrow}</MobileEyebrow>
        <h1 className="mt-1 text-3xl font-semibold leading-tight text-foreground">
          {title}
        </h1>
        <p className="mt-2 max-w-[22rem] text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0 pt-1">{action}</div> : null}
    </header>
  );
}

export function MobileFinanceTabs<T extends string>({
  value,
  options,
  onValueChange,
  className,
}: {
  value: T;
  options: Array<{ value: T; label: string; description?: string; icon: LucideIcon }>;
  onValueChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label="Áreas do financeiro"
      className={cn(
        "grid grid-cols-2 gap-1 rounded-2xl border border-border/60 bg-background/85 p-1 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-background/85",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-xl px-3 text-left text-sm font-semibold",
              interactiveState,
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted/70",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block truncate">{option.label}</span>
              {option.description ? (
                <span
                  className={cn(
                    "mt-0.5 block truncate text-xs font-medium",
                    active ? "text-background/70" : "text-muted-foreground",
                  )}
                >
                  {option.description}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function MobileFinanceButton({
  children,
  className,
  variant = "primary",
  loading = false,
  disabled,
  type = "button",
  ...props
}: ComponentPropsWithoutRef<"button"> & {
  variant?: "primary" | "secondary" | "ghost" | "light" | "danger";
  loading?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:pointer-events-none disabled:opacity-45",
        interactiveState,
        variant === "primary" && "bg-foreground text-background shadow-sm",
        variant === "secondary" && "border border-border/60 bg-card text-foreground dark:border-white/10",
        variant === "ghost" && "bg-transparent text-foreground hover:bg-muted/70",
        variant === "light" && "bg-background text-foreground hover:bg-muted",
        variant === "danger" && "border border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300",
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

export function MobileFinanceIconButton({
  icon: Icon,
  label,
  className,
  type = "button",
  ...props
}: ComponentPropsWithoutRef<"button"> & {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border/60 bg-card text-foreground shadow-sm dark:border-white/10",
        interactiveState,
        className,
      )}
      {...props}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}

export function MobileFinanceHero({
  eyebrow,
  title,
  value,
  description,
  icon: Icon,
  tone = "dark",
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  value: string;
  description?: string;
  icon: LucideIcon;
  tone?: Tone;
  action?: ReactNode;
  children?: ReactNode;
}) {
  const styles = toneStyles[tone];

  return (
    <section className={cn("overflow-hidden p-5", styles.surface)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", styles.icon)}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className={cn("truncate text-xs font-semibold uppercase", styles.muted)}>
              {eyebrow}
            </p>
            <h2 className={cn("mt-1 truncate text-base font-semibold", styles.text)}>
              {title}
            </h2>
          </div>
        </div>
        {action}
      </div>
      <p
        className={cn("mt-7 break-words text-4xl font-semibold leading-none", styles.text)}
        aria-live="polite"
      >
        {value}
      </p>
      {description ? (
        <p className={cn("mt-3 text-sm leading-6", styles.muted)}>
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-5">{children}</div> : null}
    </section>
  );
}

export function MobileMetricCard({
  label,
  value,
  caption,
  icon: Icon,
  emphasis = false,
  tone = emphasis ? "dark" : "default",
  onClick,
}: {
  label: string;
  value: string;
  caption?: string;
  icon: LucideIcon;
  emphasis?: boolean;
  tone?: Tone;
  onClick?: () => void;
}) {
  const styles = toneStyles[tone];
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", styles.icon)}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        {onClick ? <ChevronRight className="mt-1 h-4 w-4 opacity-40" aria-hidden="true" /> : null}
      </div>
      <p className={cn("mt-5 text-xs font-semibold uppercase", styles.muted)}>
        {label}
      </p>
      <p className={cn("mt-1 break-words text-xl font-semibold leading-tight", tone === "default" ? styles.text : styles.accent)} aria-live="polite">
        {value}
      </p>
      {caption ? (
        <p className={cn("mt-1 line-clamp-2 text-xs leading-5", styles.muted)}>
          {caption}
        </p>
      ) : null}
    </>
  );

  const classes = cn(
    "min-h-[136px] rounded-2xl border p-4 text-left",
    styles.surface,
    onClick && interactiveState,
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        {content}
      </button>
    );
  }

  return <article className={classes}>{content}</article>;
}

export function MobileActionButton({
  label,
  description,
  icon: Icon,
  onClick,
  disabled = false,
  badge,
  tone = "default",
}: {
  label: string;
  description?: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  badge?: string;
  tone?: Tone;
}) {
  const styles = toneStyles[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={description ? `${label}. ${description}` : label}
      className={cn(
        "flex min-h-[108px] flex-col items-start justify-between rounded-2xl border p-4 text-left disabled:cursor-not-allowed disabled:opacity-45",
        styles.surface,
        interactiveState,
      )}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", styles.icon)}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        {badge ? (
          <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="mt-4">
        <p className={cn("text-sm font-semibold", styles.text)}>{label}</p>
        {description ? (
          <p className={cn("mt-1 line-clamp-2 text-xs leading-5", styles.muted)}>
            {description}
          </p>
        ) : null}
      </div>
    </button>
  );
}

export function MobileSectionTitle({
  title,
  description,
  trailing,
}: {
  title: string;
  description?: string;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold leading-tight text-foreground">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  );
}

export function MobileFinanceInsightStrip({
  items,
}: {
  items: Array<{ label: string; value: string; icon: LucideIcon; tone?: Tone }>;
}) {
  return (
    <div className="-mx-4 overflow-x-auto pb-1 no-scrollbar" aria-label="Resumo rápido">
      <ul className="flex min-w-max gap-2.5 px-4" role="list">
        {items.map((item) => {
          const Icon = item.icon;
          const tone = item.tone || "default";
          const styles = toneStyles[tone];

          return (
            <li
              key={`${item.label}-${item.value}`}
              className={cn("flex w-40 items-center gap-3 rounded-2xl border p-3", styles.surface)}
            >
              <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", styles.icon)}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className={cn("truncate text-xs font-semibold uppercase", styles.muted)}>
                  {item.label}
                </p>
                <p className={cn("mt-0.5 truncate text-sm font-semibold", tone === "default" ? styles.text : styles.accent)}>
                  {item.value}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function MobileFinanceListRow({
  icon: Icon,
  title,
  description,
  meta,
  value,
  tone = "default",
  status,
  onClick,
  valueMuted = false,
  disabled = false,
  trailing,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  meta?: string;
  value?: string;
  tone?: Tone;
  status?: string;
  onClick?: () => void;
  valueMuted?: boolean;
  disabled?: boolean;
  trailing?: ReactNode;
  className?: string;
}) {
  const styles = toneStyles[tone];
  const content = (
    <>
      <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", styles.icon)}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-sm font-semibold text-foreground">{title}</p>
          {status ? (
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
              {status}
            </span>
          ) : null}
        </div>
        {description ? (
          <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        ) : null}
        {meta ? (
          <p className="mt-1 text-xs font-medium uppercase text-muted-foreground/75">
            {meta}
          </p>
        ) : null}
      </div>
      {value ? (
        <p
          className={cn(
            "shrink-0 text-right text-sm font-semibold",
            valueMuted ? "text-muted-foreground" : styles.accent,
          )}
        >
          {value}
        </p>
      ) : trailing ? (
        trailing
      ) : onClick ? (
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/55" aria-hidden="true" />
      ) : null}
    </>
  );

  const classes = cn(
    "flex min-h-[68px] w-full items-center gap-3 rounded-2xl border border-border/60 bg-card p-3.5 text-left dark:border-white/10",
    onClick && interactiveState,
    disabled && "cursor-not-allowed opacity-45",
    className,
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} disabled={disabled} className={classes}>
        {content}
      </button>
    );
  }

  return <article className={classes}>{content}</article>;
}

export function MobileActionListItem({
  icon,
  title,
  description,
  status,
  onClick,
  disabled = false,
  destructive = false,
  trailing,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  status?: string;
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <MobileFinanceListRow
      icon={icon}
      title={title}
      description={description}
      status={status}
      tone={destructive ? "danger" : "default"}
      onClick={onClick}
      disabled={disabled}
      trailing={trailing}
      className={className}
    />
  );
}

export function MobileEmptyState({
  title,
  description,
  icon: Icon,
  action,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <div className={cn(mobileFinanceSurface, "px-5 py-9 text-center")} role="status" aria-live="polite">
      {Icon ? (
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
      ) : null}
      <p className={cn("text-base font-semibold text-foreground", Icon && "mt-4")}>{title}</p>
      <p className="mx-auto mt-2 max-w-[260px] text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function MobileFinanceSheet({
  open,
  onOpenChange,
  eyebrow,
  title,
  description,
  icon: Icon,
  children,
  footer,
  contentClassName,
  bodyClassName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eyebrow?: string;
  title?: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
  footer?: ReactNode;
  contentClassName?: string;
  bodyClassName?: string;
}) {
  const hasHeader = Boolean(title || eyebrow || description || Icon);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className={cn(
          "[&>div:first-child]:hidden z-[120] flex h-[min(92dvh,46rem)] max-h-[92dvh] overflow-hidden rounded-t-3xl border-border/60 bg-background p-0 shadow-2xl dark:border-white/10",
          contentClassName,
        )}
      >
        <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/25" />
        {hasHeader ? (
          <header className="shrink-0 px-5 pb-4 pt-5">
            <div className="flex items-start gap-3">
              {Icon ? (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card dark:border-white/10">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
              ) : null}
              <div className="min-w-0">
                {eyebrow ? <MobileEyebrow>{eyebrow}</MobileEyebrow> : null}
                {title ? <h2 className="mt-1 text-2xl font-semibold leading-tight text-foreground">{title}</h2> : null}
                {description ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p> : null}
              </div>
            </div>
          </header>
        ) : null}
        <div
          className={cn(
            "mobile-scroll-owner min-h-0 flex-1 overflow-y-auto overscroll-contain px-5",
            footer ? "pb-5" : "pb-[calc(24px+env(safe-area-inset-bottom))]",
            bodyClassName,
          )}
        >
          {children}
        </div>
        {footer ? (
          <footer className="shrink-0 border-t border-border/60 bg-background/95 px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl dark:border-white/10">
            {footer}
          </footer>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}

export function MobileFinanceField({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase text-muted-foreground">
        {label}
      </span>
      {children}
      {hint ? <span className="mt-2 block text-xs leading-5 text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export function MobileFinanceSelect({
  className,
  ...props
}: ComponentPropsWithoutRef<"select">) {
  return (
    <select
      className={cn(
        mobileFinanceInputClassName,
        "appearance-none pr-10",
        className,
      )}
      {...props}
    />
  );
}

export function MobileFinanceSuccess({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="py-7 text-center" role="status" aria-live="polite">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground text-background">
        <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
      </div>
      <MobileEyebrow className="mt-6">{eyebrow}</MobileEyebrow>
      <h2 className="mt-2 text-2xl font-semibold text-foreground">{title}</h2>
      <p className="mx-auto mt-2 max-w-[18rem] text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}
