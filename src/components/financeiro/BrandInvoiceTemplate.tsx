import { Landmark, ShieldCheck } from "lucide-react";

interface ReceiptTemplateProps {
  logoUrl?: string;
  professionalName: string;
  professionalRegistry?: string;
  patientName: string;
  patientDoc?: string;
  amountFormatted: string;
  amountInWords?: string;
  description: string;
  date: string;
  location?: string;
}

export const BrandInvoiceTemplate = ({
  professionalName,
  professionalRegistry,
  patientName,
  patientDoc,
  amountFormatted,
  description,
  date,
  location,
}: ReceiptTemplateProps) => {
  return (
    <div className="relative flex aspect-[210/297] w-full flex-col overflow-hidden bg-white p-[20mm] font-serif text-[#111] selection:bg-black/5 print:p-[15mm] print:shadow-none">
      <div className="pointer-events-none absolute inset-0 flex rotate-[-35deg] scale-110 select-none items-center justify-center opacity-[0.012]">
        <div className="grid grid-cols-2 gap-x-40 gap-y-32">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="whitespace-nowrap text-3xl font-black uppercase tracking-[0.6em]">
              NeuroNex Protocol
            </span>
          ))}
        </div>
      </div>

      <div className="relative z-10 mb-14 flex items-start justify-between border-b border-black/[0.06] pb-10">
        <div className="space-y-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-black text-4xl font-bold text-white shadow-2xl">N</div>
          <div>
            <h1 className="text-[11px] font-black uppercase tracking-[0.6em] text-zinc-400/80">Documento oficial</h1>
            <p className="mt-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-zinc-300">
              REF: <span className="font-mono text-zinc-400">{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end text-right">
          <h2 className="mb-4 text-7xl font-extralight italic tracking-[-0.08em] text-black">Recibo</h2>
          <div className="flex items-center justify-end gap-2.5 rounded-full border border-emerald-100/50 bg-emerald-50/50 px-4 py-1.5 text-emerald-600">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Autenticidade validada</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 mb-14 flex items-center justify-between rounded-[32px] border border-zinc-100/50 bg-zinc-50/30 p-8">
        <div>
          <p className="mb-3 text-[11px] font-black uppercase tracking-[0.5em] text-zinc-400">Importância de</p>
          <p className="text-7xl font-semibold leading-none tracking-tighter text-black">{amountFormatted}</p>
        </div>
        <div className="mx-4 h-20 w-px bg-zinc-200/50" />
        <div className="text-right">
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.3em] text-zinc-400">Estado</p>
          <div className="inline-block rounded-xl bg-emerald-600 px-5 py-2 text-white shadow-lg shadow-emerald-200">
            <p className="text-[11px] font-black uppercase tracking-widest">Liquidado</p>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex-1 space-y-14 px-2">
        <div className="space-y-10 text-xl font-light italic leading-relaxed text-zinc-800">
          <p className="leading-relaxed">
            Recebemos de <strong className="border-b border-black/20 pb-0.5 font-bold not-italic text-black">{patientName}</strong>
            {patientDoc && <span className="ml-4 font-sans text-sm font-normal not-italic text-zinc-400">({patientDoc})</span>}, a importância líquida acima discriminada,
            correspondente à prestação de serviços:
          </p>

          <div className="group relative overflow-hidden rounded-[40px] border border-zinc-100/50 bg-zinc-50/50 p-12 font-sans text-lg leading-relaxed text-zinc-700 shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)]">
            <div className="absolute -right-4 -top-4 p-4 opacity-[0.03] transition-opacity group-hover:opacity-10">
              <Landmark className="h-32 w-32" />
            </div>
            <div className="relative z-10 whitespace-pre-wrap">{description}</div>
          </div>
        </div>

        <div className="flex justify-between border-t border-zinc-100 pt-20">
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-400">Data e local</p>
              <p className="text-[15px] font-medium text-black">{location}</p>
              <p className="mt-0.5 text-sm text-zinc-500">{date}</p>
            </div>
          </div>
          <div className="space-y-5 text-right">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-400">Responsável técnico</p>
              <p className="text-[15px] font-bold uppercase tracking-widest text-black">{professionalName}</p>
              <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">{professionalRegistry}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 mb-6 mt-auto flex flex-col items-center">
        <div className="flex w-96 flex-col items-center">
          <div className="mb-8 h-px w-full bg-black/60" />
          <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.5em] text-zinc-300">Assinatura digital validada</p>
          <div className="flex items-center gap-5 rounded-2xl border border-zinc-100 bg-zinc-50/50 px-8 py-3.5">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <p className="font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400">
              Hash: <span className="font-mono text-zinc-500">{Math.random().toString(16).substr(2, 16).toUpperCase()}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-zinc-50 pt-12 font-sans text-[8px] font-bold uppercase tracking-[0.4em] text-zinc-300">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500/30" />
          NeuroNex Bank Infrastructure - Protected Document
        </div>
        <span className="italic tracking-widest opacity-40">Page 01 / 01</span>
      </div>
    </div>
  );
};
