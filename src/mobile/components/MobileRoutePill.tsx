"use client";

import { ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";

const labels: Record<string, string> = {
  agenda: "Agenda",
  pacientes: "Pacientes",
  teleconsulta: "Teleconsulta",
  notas: "Notas",
  financeiro: "Financeiro",
  gestao: "Gestão",
  neurofinance: "NeuroFinance",
  pix: "Pix",
  pagar: "Pagar",
  qrcode: "QR Code",
  recebidos: "Recebidos",
  chaves: "Chaves",
  transferir: "Transferir",
  saque: "Saque",
  pagamentos: "Pagamentos",
  boleto: "Boleto",
  agendados: "Agendados",
  extrato: "Extrato",
  receitas: "Receitas",
  despesas: "Despesas",
  cobrancas: "Cobranças",
  inadimplencia: "Inadimplência",
  planejamento: "Planejamento",
  relatorios: "Relatórios",
  ajustes: "Ajustes",
  integracoes: "Integrações",
  "synapse-ai": "Synapse",
};

const looksLikeId = (value: string) => value.length > 20 && value.includes("-");

export const MobileRoutePill = () => {
  const location = useLocation();
  const crumbs = useMemo(() => {
    const segments = location.pathname.split("/").filter(Boolean);
    let path = "";

    return segments.map((segment, index) => {
      path += `/${segment}`;
      const previous = segments[index - 1];
      const label = looksLikeId(segment)
        ? previous === "pacientes" ? "Prontuário" : "Detalhes"
        : labels[segment] || segment.replace(/-/g, " ");
      return { label, href: path };
    }).slice(-4);
  }, [location.pathname]);

  if (location.pathname === "/dashboard" || crumbs.length === 0) return null;

  return (
    <nav aria-label="Trilha da página" className="min-w-0 max-w-[calc(100vw-7.5rem)] overflow-hidden rounded-[13px] border border-foreground/[0.055] bg-background/72 px-2.5 py-2 shadow-[0_10px_28px_-22px_rgba(0,0,0,0.65)] backdrop-blur-xl dark:border-white/10 dark:bg-black/35">
      <div className="flex min-w-0 items-center gap-1 overflow-hidden">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          return (
            <div key={crumb.href} className="flex min-w-0 items-center gap-1">
              {index > 0 ? <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/30" /> : null}
              {last ? (
                <span className="truncate text-[7px] font-black uppercase tracking-[0.09em] text-foreground">{crumb.label}</span>
              ) : (
                <Link to={crumb.href} className="truncate text-[7px] font-black uppercase tracking-[0.09em] text-muted-foreground/55 active:text-foreground">
                  {crumb.label}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
};
