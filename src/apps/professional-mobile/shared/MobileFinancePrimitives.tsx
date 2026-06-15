import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const mobileFinanceSurface =
  "rounded-[24px] border border-border/40 bg-card/70 shadow-[0_20px_60px_-42px_rgba(0,0,0,0.75)] backdrop-blur-xl";

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

export function MobileEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
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
    <header className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <MobileEyebrow>{eyebrow}</MobileEyebrow>
        <h1 className="mt-2 text-[32px] font-bold leading-[0.98] tracking-[-0.045em] text-foreground">
          {title}
        </h1>
        <p className="mt-3 max-w-[32rem] text-[13px] leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
      {action}
    </header>
  );
}

export function MobileMetricCard({
  label,
  value,
  caption,
  icon: Icon,
  emphasis = false,
}: {
  label: string;
  value: string;
  caption?: string;
  icon: LucideIcon;
  emphasis?: boolean;
}) {
  return (
    <article
      className={cn(
        mobileFinanceSurface,
        "min-h-[148px] p-4",
        emphasis && "bg-foreground text-background",
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-[14px] border",
          emphasis
            ? "border-background/15 bg-background/10"
            : "border-border/40 bg-foreground/[0.035]",
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={1.6} />
      </div>
      <p
        className={cn(
          "mt-5 text-[9px] font-medium uppercase tracking-[0.2em]",
          emphasis ? "text-background/60" : "text-muted-foreground",
        )}
      >
        {label}
      </p>
      <p className="mt-1 text-[20px] font-semibold tracking-[-0.035em]">{value}</p>
      {caption ? (
        <p
          className={cn(
            "mt-1 text-[10px]",
            emphasis ? "text-background/55" : "text-muted-foreground/70",
          )}
        >
          {caption}
        </p>
      ) : null}
    </article>
  );
}

export function MobileActionButton({
  label,
  description,
  icon: Icon,
  onClick,
  disabled = false,
}: {
  label: string;
  description?: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        mobileFinanceSurface,
        "flex min-h-[112px] flex-col items-start justify-between p-4 text-left transition active:scale-[0.985]",
        disabled && "cursor-not-allowed opacity-45",
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-border/40 bg-foreground/[0.035]">
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
      </div>
      <div className="mt-4">
        <p className="text-[13px] font-semibold tracking-[-0.015em] text-foreground">
          {label}
        </p>
        {description ? (
          <p className="mt-1 text-[10px] leading-4 text-muted-foreground">{description}</p>
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
      <div>
        <h2 className="text-[17px] font-semibold tracking-[-0.025em] text-foreground">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {trailing}
    </div>
  );
}

export function MobileEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className={cn(mobileFinanceSurface, "px-5 py-10 text-center")}>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mx-auto mt-2 max-w-[260px] text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
