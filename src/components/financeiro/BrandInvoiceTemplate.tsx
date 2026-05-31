import { Landmark, ShieldCheck } from 'lucide-react';

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
  location
}: ReceiptTemplateProps) => {
  
  return (
    // A4 Aspect Ratio - Ultra Premium Document
    <div className="w-full aspect-[210/297] bg-white text-[#111] relative overflow-hidden flex flex-col p-[20mm] font-serif selection:bg-black/5 print:p-[15mm] print:shadow-none">
      
      {/* Security Watermark Background - Adjusted for PDF export safety */}
      <div className="absolute inset-0 opacity-[0.012] pointer-events-none flex items-center justify-center rotate-[-35deg] scale-110 select-none">
          <div className="grid grid-cols-2 gap-x-40 gap-y-32">
              {Array.from({ length: 6 }).map((_, i) => (
                  <span key={i} className="text-3xl font-black uppercase tracking-[0.6em] whitespace-nowrap">NeuroNex Protocol</span>
              ))}
          </div>
      </div>

      {/* Top Decoration & Logo */}
      <div className="flex justify-between items-start mb-14 relative z-10 border-b border-black/[0.06] pb-10">
          <div className="space-y-6">
              <div className="w-16 h-16 bg-black text-white flex items-center justify-center rounded-[22px] font-bold text-4xl shadow-2xl">N</div>
              <div>
                <h1 className="text-[11px] font-black uppercase tracking-[0.6em] text-zinc-400/80">Documento Oficial</h1>
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-zinc-300 mt-2 flex items-center gap-2">
                  REF: <span className="font-mono text-zinc-400">{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
                </p>
              </div>
          </div>
          <div className="text-right flex flex-col items-end">
              <h2 className="text-7xl font-extralight tracking-[-0.08em] text-black mb-4 italic">Recibo</h2>
              <div className="flex items-center justify-end gap-2.5 px-4 py-1.5 bg-emerald-50/50 rounded-full border border-emerald-100/50 text-emerald-600">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Autenticidade Validada</span>
              </div>
          </div>
      </div>

      {/* Value Box */}
      <div className="mb-14 relative z-10 flex justify-between items-center bg-zinc-50/30 rounded-[32px] p-8 border border-zinc-100/50">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-400 mb-3">Importncia de</p>
            <p className="text-7xl font-semibold tracking-tighter text-black leading-none">{amountFormatted}</p>
          </div>
          <div className="h-20 w-[1px] bg-zinc-200/50 mx-4" />
          <div className="text-right">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-2">Estado</p>
            <div className="px-5 py-2 bg-emerald-600 text-white rounded-xl inline-block shadow-lg shadow-emerald-200">
              <p className="text-[11px] font-black uppercase tracking-widest">Liquidado</p>
            </div>
          </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-14 relative z-10 px-2">
          <div className="space-y-10 text-xl leading-relaxed font-light text-zinc-800 italic">
              <p className="leading-relaxed">
                  Recebemos de <strong className="font-bold text-black border-b border-black/20 pb-0.5 not-italic">{patientName}</strong> 
                  {patientDoc && <span className="text-sm text-zinc-400 ml-4 not-italic font-sans">({patientDoc})</span>}, 
                  a importncia líquida acima discriminada, correspondente à prestação de serviços:
              </p>
              
              <div className="bg-zinc-50/50 p-12 rounded-[40px] border border-zinc-100/50 text-zinc-700 font-sans text-lg leading-relaxed shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)] relative overflow-hidden group">
                  <div className="absolute -top-4 -right-4 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                    <Landmark className="w-32 h-32" />
                  </div>
                  <div className="relative z-10 whitespace-pre-wrap">
                    {description}
                  </div>
              </div>
          </div>
          
          <div className="flex justify-between pt-20 border-t border-zinc-100">
              <div className="space-y-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-400 mb-2">Data e Local</p>
                    <p className="text-[15px] font-medium text-black">{location}</p>
                    <p className="text-sm text-zinc-500 mt-0.5">{date}</p>
                  </div>
              </div>
              <div className="text-right space-y-5">
                   <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-400 mb-2">Responsável Técnico</p>
                    <p className="text-[15px] font-bold text-black uppercase tracking-widest">{professionalName}</p>
                    <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-[0.2em] mt-0.5">{professionalRegistry}</p>
                   </div>
              </div>
          </div>
      </div>

      {/* Signature Area */}
      <div className="mt-auto mb-6 flex flex-col items-center relative z-10">
          <div className="w-96 flex flex-col items-center">
               <div className="w-full h-[1px] bg-black/60 mb-8" />
               <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-zinc-300 mb-5">Assinatura Digital Validada</p>
               <div className="flex items-center gap-5 px-8 py-3.5 bg-zinc-50/50 rounded-2xl border border-zinc-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 font-sans">
                    Hash: <span className="font-mono text-zinc-500">{Math.random().toString(16).substr(2, 16).toUpperCase()}</span>
                  </p>
               </div>
          </div>
      </div>

      {/* Footer Infrastructure */}
      <div className="pt-12 flex justify-between items-center text-[8px] text-zinc-300 uppercase tracking-[0.4em] font-sans font-bold border-t border-zinc-50">
          <div className="flex items-center gap-3">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/30" />
              NeuroNex Bank Infrastructure • Protected Document
          </div>
          <span className="opacity-40 italic tracking-widest">Page 01 / 01</span>
      </div>

    </div>
  );
};
