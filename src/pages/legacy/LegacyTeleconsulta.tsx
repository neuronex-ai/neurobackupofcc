import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CalendarClock,
  FileText,
  Mic,
  Monitor,
  Paperclip,
  Sparkles,
  Video,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { WorkspaceTabs } from "@/components/teleconsulta/WorkspaceTabs";
import { cn } from "@/lib/utils";

const DEMO_PATIENT_ID = "00000000-0000-0000-0000-000000000000";

const mockPills = [
  { label: "Sessao ativa", icon: Video, tone: "dark" },
  { label: "Transcricao", icon: Mic, tone: "neutral" },
  { label: "Resumo IA", icon: Sparkles, tone: "neutral" },
  { label: "Anexos", icon: Paperclip, tone: "neutral" },
] as const;

const sessionRows = [
  ["Paciente", "Paciente demonstracao"],
  ["Horario", "Hoje, 14:00"],
  ["Formato", "Teleconsulta"],
  ["Estado", "Preview legado"],
] as const;

export default function LegacyTeleconsulta() {
  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_0%,hsl(var(--foreground)/0.055),transparent_32%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.18))]" />

      <main className="relative mx-auto flex min-h-screen w-full max-w-[1500px] flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4 pb-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              <Monitor className="h-4 w-4" />
              Teleconsulta
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              Workspace antigo
            </h1>
          </div>

          <Button asChild variant="outline" className="h-11 rounded-2xl">
            <Link to="/teleconsulta">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Teleconsulta atual
            </Link>
          </Button>
        </header>

        <section className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="flex min-h-0 flex-col gap-4">
            <div className="rounded-[30px] border border-border/45 bg-card/82 p-5 shadow-[0_24px_80px_-58px_rgba(0,0,0,0.7)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.035]">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-background">
                  <CalendarClock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                    Sessao
                  </p>
                  <p className="mt-1 text-lg font-black tracking-[-0.03em]">
                    Demonstracao
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                {sessionRows.map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-border/35 bg-background/55 px-4 py-3 text-sm dark:border-white/10 dark:bg-black/18"
                  >
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] border border-border/45 bg-card/82 p-5 shadow-[0_24px_80px_-58px_rgba(0,0,0,0.7)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.035]">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                <FileText className="h-4 w-4" />
                Blocos antigos
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {mockPills.map(({ label, icon: Icon, tone }) => (
                  <span
                    key={label}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em]",
                      tone === "dark"
                        ? "border-foreground bg-foreground text-background"
                        : "border-border/50 bg-background/60 text-muted-foreground dark:border-white/10 dark:bg-black/20",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </aside>

          <div className="min-h-[680px] overflow-hidden rounded-[34px] border border-border/45 bg-card/68 p-4 shadow-[0_28px_100px_-68px_rgba(0,0,0,0.86)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.025]">
            <WorkspaceTabs
              patientId={DEMO_PATIENT_ID}
              patientName="Paciente demonstracao"
            />
          </div>
        </section>
      </main>
    </div>
  );
}
