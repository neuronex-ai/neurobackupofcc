import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import type { Message } from "@/types";
import {
  ArrowRight,
  Bot,
  Calendar,
  Check,
  Copy,
  FileText,
  Loader2,
  Mic,
  RefreshCcw,
  Sparkles,
  User,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";
import remarkGfm from "remark-gfm";

type SynapseTone = "default" | "dark" | "success" | "warning" | "danger";

const toneStyles: Record<SynapseTone, { surface: string; icon: string; text: string; muted: string }> = {
  default: {
    surface: "border-border/40 bg-card/74 text-foreground dark:border-white/10 dark:bg-white/[0.035]",
    icon: "bg-foreground/[0.045] text-muted-foreground",
    text: "text-foreground",
    muted: "text-muted-foreground/68",
  },
  dark: {
    surface: "border-foreground bg-foreground text-background",
    icon: "bg-background/12 text-background",
    text: "text-background",
    muted: "text-background/62",
  },
  success: {
    surface: "border-emerald-500/18 bg-emerald-500/[0.07] text-emerald-700 dark:text-emerald-300",
    icon: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    text: "text-emerald-700 dark:text-emerald-300",
    muted: "text-emerald-700/65 dark:text-emerald-300/65",
  },
  warning: {
    surface: "border-amber-500/20 bg-amber-500/[0.075] text-amber-800 dark:text-amber-200",
    icon: "bg-amber-500/10 text-amber-700 dark:text-amber-200",
    text: "text-amber-800 dark:text-amber-200",
    muted: "text-amber-800/65 dark:text-amber-200/65",
  },
  danger: {
    surface: "border-rose-500/18 bg-rose-500/[0.065] text-rose-700 dark:text-rose-300",
    icon: "bg-rose-500/10 text-rose-600 dark:text-rose-300",
    text: "text-rose-700 dark:text-rose-300",
    muted: "text-rose-700/65 dark:text-rose-300/65",
  },
};

export const mobileSynapseInputClassName =
  "mt-2 h-[52px] w-full rounded-[17px] border border-border/50 bg-card px-4 text-sm font-medium text-foreground outline-none transition placeholder:text-muted-foreground/42 focus:border-foreground/25 focus-visible:ring-2 focus-visible:ring-foreground/12 dark:border-white/10 dark:bg-white/[0.035]";

export function MobileSynapseEyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/58", className)}>
      {children}
    </p>
  );
}

export function MobileSynapseIconButton({
  icon: Icon,
  label,
  className,
  ...props
}: ComponentPropsWithoutRef<"button"> & {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] border border-border/45 bg-background/78 text-foreground shadow-sm backdrop-blur-xl transition active:scale-95 dark:border-white/10 dark:bg-black/45",
        className,
      )}
      {...props}
    >
      <Icon className="h-[18px] w-[18px]" />
    </button>
  );
}

export function MobileSynapseButton({
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
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-[15px] px-4 text-[9px] font-black uppercase tracking-[0.14em] transition active:scale-[0.985] disabled:pointer-events-none disabled:opacity-45",
        variant === "primary" && "bg-foreground text-background shadow-sm",
        variant === "secondary" && "border border-border/45 bg-card/78 text-foreground dark:border-white/10 dark:bg-white/[0.04]",
        variant === "ghost" && "bg-transparent text-muted-foreground active:bg-foreground/[0.045]",
        variant === "light" && "bg-background text-foreground hover:bg-background/90",
        variant === "danger" && "border border-rose-500/20 bg-rose-500/[0.07] text-rose-600 dark:text-rose-300",
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

export function MobileSynapseHero({
  modeLabel,
  title,
  description,
  status,
}: {
  modeLabel: string;
  title: string;
  description: string;
  status: string;
}) {
  return (
    <section className="overflow-hidden rounded-[26px] border border-foreground bg-foreground p-5 text-background">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <MobileSynapseEyebrow className="text-background/55">{modeLabel}</MobileSynapseEyebrow>
          <h1 className="mt-2 text-[2.28rem] font-black leading-[0.9] tracking-[-0.065em]">
            {title}
          </h1>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[17px] bg-background/10">
          <Sparkles className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-xs font-medium leading-relaxed text-background/68">
        {description}
      </p>
      <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-background/10 px-3 py-2">
        <span className="h-1.5 w-1.5 rounded-full bg-background" />
        <span className="text-[8px] font-black uppercase tracking-[0.15em] text-background/68">{status}</span>
      </div>
    </section>
  );
}

export function MobileSynapsePromptCard({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[112px] flex-col items-start justify-between rounded-[22px] border border-border/40 bg-card/74 p-4 text-left transition active:scale-[0.985] dark:border-white/10 dark:bg-white/[0.035]"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-foreground/[0.045] text-muted-foreground">
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <p className="text-[13px] font-black leading-tight tracking-[-0.015em] text-foreground">{label}</p>
    </button>
  );
}

export function MobileSynapseSessionRow({
  title,
  description,
  active,
  onClick,
  onDelete,
}: {
  title: string;
  description: string;
  active: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[20px] border p-3.5",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border/40 bg-card/72 text-foreground dark:border-white/10 dark:bg-white/[0.03]",
      )}
    >
      <button type="button" onClick={onClick} className="min-w-0 flex-1 text-left">
        <p className="truncate text-[13px] font-black tracking-[-0.015em]">{title}</p>
        <p className={cn("mt-1 text-[9px] font-medium", active ? "text-background/58" : "text-muted-foreground/62")}>
          {description}
        </p>
      </button>
      <button
        type="button"
        onClick={onDelete}
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] transition active:scale-95",
          active ? "bg-background/10 text-background/72" : "bg-foreground/[0.045] text-muted-foreground",
        )}
        aria-label="Excluir conversa"
      >
        <span className="text-lg leading-none">×</span>
      </button>
    </div>
  );
}

type RichAction = {
  type: string;
  data?: Record<string, unknown>;
  payload?: Record<string, unknown>;
};

const toRecord = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" ? value as Record<string, unknown> : undefined;

const normalizeRichAction = (richData: unknown): RichAction | null => {
  if (!richData || typeof richData !== "object") return null;
  const candidate = richData as Record<string, unknown>;
  const type = typeof candidate.type === "string"
    ? candidate.type
    : typeof candidate.__actionType === "string"
      ? candidate.__actionType
      : null;
  if (typeof type !== "string" || !type) return null;
  return { type, data: toRecord(candidate.data), payload: toRecord(candidate.payload) };
};

const actionMeta = (type: string): { title: string; description: string; icon: LucideIcon; path?: string } => {
  const normalized = type.toLowerCase();
  if (normalized.includes("appointment") || normalized.includes("agenda")) {
    return { title: "Agenda", description: "Abrir compromissos relacionados.", icon: Calendar, path: "/agenda" };
  }
  if (normalized.includes("invoice") || normalized.includes("financial")) {
    return { title: "Financeiro", description: "Abrir informações financeiras.", icon: Wallet, path: "/financeiro" };
  }
  if (normalized.includes("document")) {
    return { title: "Documento", description: "Documento preparado pelo Synapse.", icon: FileText };
  }
  return { title: type.replace(/_/g, " "), description: "Ação preparada pelo Synapse.", icon: Sparkles };
};

export function MobileSynapseActionCard({ action }: { action: RichAction }) {
  const navigate = useNavigate();
  const payload = action.payload || action.data || {};
  const meta = actionMeta(action.type);
  const Icon = meta.icon;
  const rawEntityId = payload.id || payload.patient_id || payload.appointment_id;
  const entityId = typeof rawEntityId === "string" ? rawEntityId : undefined;
  const path = entityId && action.type.includes("patient")
    ? `/pacientes/${entityId}`
    : meta.path;

  return (
    <button
      type="button"
      onClick={() => path ? navigate(path) : undefined}
      className="mt-3 flex w-full items-center gap-3 rounded-[19px] border border-border/40 bg-background/78 p-3.5 text-left transition active:scale-[0.99] dark:border-white/10 dark:bg-black/35"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-foreground/[0.05] text-muted-foreground">
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-black capitalize tracking-[-0.01em] text-foreground">{meta.title}</p>
        <p className="mt-0.5 line-clamp-2 text-[10px] font-medium leading-relaxed text-muted-foreground/66">{meta.description}</p>
      </div>
      {path ? <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/35" /> : null}
    </button>
  );
}

export function MobileSynapseMessage({
  message,
  richData,
}: {
  message: Message;
  richData?: unknown;
}) {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === "assistant";
  const action = useMemo(() => normalizeRichAction(richData), [richData]);
  const displayContent = typeof message.content === "string" ? message.content : String(message.content || "");

  const copyMessage = async () => {
    await navigator.clipboard.writeText(displayContent);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <article
      className={cn(
        "rounded-[24px] border p-4",
        isAssistant
          ? "border-border/35 bg-card/72 dark:border-white/10 dark:bg-white/[0.028]"
          : "border-foreground bg-foreground text-background",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px]",
              isAssistant ? "bg-foreground/[0.045] text-muted-foreground" : "bg-background/10 text-background",
            )}
          >
            {isAssistant ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <p className={cn("truncate text-[9px] font-black uppercase tracking-[0.16em]", isAssistant ? "text-muted-foreground/55" : "text-background/55")}>
              {isAssistant ? "Synapse" : "Você"}
            </p>
            <p className={cn("mt-0.5 text-[8px] font-medium", isAssistant ? "text-muted-foreground/45" : "text-background/45")}>
              {new Date(message.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={copyMessage}
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] transition active:scale-95",
            isAssistant ? "bg-foreground/[0.04] text-muted-foreground" : "bg-background/10 text-background/72",
          )}
          aria-label="Copiar mensagem"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>

      <div
        className={cn(
          "mt-3 max-w-none text-[14px] font-medium leading-relaxed",
          isAssistant ? "text-foreground" : "text-background",
          "[&_a]:font-bold [&_a]:underline [&_a]:underline-offset-4",
          "[&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[12px]",
          isAssistant ? "[&_code]:bg-foreground/[0.06]" : "[&_code]:bg-background/10",
          "[&_li]:my-1 [&_ol]:pl-5 [&_p]:my-2 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-[16px] [&_pre]:p-3 [&_table]:my-3 [&_table]:w-full [&_table]:text-left [&_td]:border-t [&_td]:border-border/30 [&_td]:py-2 [&_td]:pr-3 [&_th]:py-2 [&_th]:pr-3 [&_ul]:pl-5",
        )}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayContent}</ReactMarkdown>
      </div>

      {action ? <MobileSynapseActionCard action={action} /> : null}
    </article>
  );
}

export function MobileSynapseThinking() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1.5 rounded-[20px] border border-border/35 bg-card/72 px-4 py-3 dark:border-white/10 dark:bg-white/[0.028]">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/55" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/55 [animation-delay:0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/55 [animation-delay:0.3s]" />
      </div>
    </div>
  );
}

export function MobileSynapseVoicePanel({
  isConnected,
  isListening,
  isProcessing,
  isSpeaking,
  lastResponse,
  error,
  onToggleRecording,
  onReset,
}: {
  isConnected: boolean;
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  lastResponse: string;
  error?: string | null;
  onToggleRecording: () => void;
  onReset: () => void;
}) {
  const statusLabel = error
    ? "Ajuste necessário"
    : isSpeaking
      ? "Respondendo"
      : isProcessing
        ? "Conectando"
        : isListening
          ? "Ouvindo"
          : isConnected
            ? "Pausado"
            : "Modo voz";
  const title = error
    ? "Não consegui abrir a voz."
    : isSpeaking
      ? "Synapse está falando."
      : isListening
        ? "Pode falar."
        : "Synapse por voz";
  const description = error || lastResponse || (isConnected
    ? "Toque no controle para pausar ou retomar a escuta em tempo real."
    : "Toque para iniciar uma conversa de baixa latência com voz nativa do Gemini Live.");

  return (
    <section className="flex min-h-full flex-col justify-center px-5 pb-12 pt-[calc(6.4rem+env(safe-area-inset-top))]">
      <div className="rounded-[30px] border border-border/40 bg-card/78 p-6 text-center dark:border-white/10 dark:bg-white/[0.035]">
        <MobileSynapseEyebrow>{statusLabel}</MobileSynapseEyebrow>
        <h2 className="mt-2 text-3xl font-black leading-[0.92] tracking-[-0.055em] text-foreground">
          {title}
        </h2>
        <p className="mx-auto mt-3 max-w-[18rem] text-xs font-medium leading-relaxed text-muted-foreground/68">
          {description}
        </p>

        <button
          type="button"
          onClick={onToggleRecording}
          disabled={isProcessing}
          className={cn(
            "mx-auto mt-9 flex h-32 w-32 items-center justify-center rounded-full border transition active:scale-95 disabled:opacity-65",
            error
              ? "border-rose-500/30 bg-rose-500/10 text-rose-500"
              : isListening || isSpeaking
              ? "border-foreground bg-foreground text-background shadow-[0_22px_70px_-42px_rgba(0,0,0,0.9)]"
              : "border-border/45 bg-background text-foreground dark:border-white/10 dark:bg-black/35",
          )}
        >
          {isProcessing ? (
            <Loader2 className="h-10 w-10 animate-spin" />
          ) : isListening || isSpeaking ? (
            <div className="flex h-12 items-center gap-1.5">
              {[0, 1, 2, 3].map((item) => (
                <span
                  key={item}
                  className="w-1.5 rounded-full bg-current animate-[audio-wave_0.85s_ease-in-out_infinite]"
                  style={{ height: `${18 + item * 7}px`, animationDelay: `${item * 0.09}s` }}
                />
              ))}
            </div>
          ) : (
            <Mic className="h-10 w-10" />
          )}
        </button>

        <div className="mt-8 flex justify-center">
          <MobileSynapseButton variant="secondary" onClick={onReset} disabled={isProcessing}>
            <RefreshCcw className="h-4 w-4" />
            Reiniciar
          </MobileSynapseButton>
        </div>
      </div>
    </section>
  );
}

export function MobileSynapseSheet({
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
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className={cn(
          "[&>div:first-child]:hidden z-[130] flex h-[min(92dvh,46rem)] max-h-[92dvh] overflow-hidden rounded-t-[30px] border-border/40 bg-background p-0 shadow-2xl dark:border-white/10",
          contentClassName,
        )}
      >
        <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-foreground/14" />
        <header className="shrink-0 px-5 pb-4 pt-5">
          <div className="flex items-start gap-3">
            {Icon ? (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] border border-border/40 bg-card/72 dark:border-white/10 dark:bg-white/[0.03]">
                <Icon className="h-5 w-5" />
              </div>
            ) : null}
            <div className="min-w-0">
              {eyebrow ? <MobileSynapseEyebrow>{eyebrow}</MobileSynapseEyebrow> : null}
              {title ? <h2 className="mt-1 text-2xl font-black leading-none tracking-[-0.05em] text-foreground">{title}</h2> : null}
              {description ? <p className="mt-2 text-xs font-medium leading-relaxed text-muted-foreground/70">{description}</p> : null}
            </div>
          </div>
        </header>
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
          <footer className="shrink-0 border-t border-border/40 bg-background/94 px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl dark:border-white/10">
            {footer}
          </footer>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}

export function MobileSynapseField({
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
      <span className="text-[9px] font-black uppercase tracking-[0.16em] text-muted-foreground/62">
        {label}
      </span>
      {children}
      {hint ? <span className="mt-2 block text-[10px] font-medium leading-relaxed text-muted-foreground/62">{hint}</span> : null}
    </label>
  );
}
