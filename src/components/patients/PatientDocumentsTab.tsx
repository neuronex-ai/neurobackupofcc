"use client";

import { useAuth } from "@/components/auth/SessionContextProvider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePatientDocuments } from "@/hooks/use-patient-documents";
import { useUploadDocument } from "@/hooks/use-upload-document";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { DownloadCloud, Eye, FileText, FolderOpen, Loader2, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DocumentPreviewModal } from "./DocumentPreviewModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface PatientDocumentsTabProps {
  patientId: string;
}

const BUCKET_NAME = 'files_psico';

const useDeleteDocument = (patientId: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation({
    mutationFn: async (filePath: string) => {
      if (!userId) throw new Error("Usuário não autenticado.");
      const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);
      if (error) throw new Error(error.message);
      return true;
    },
    onSuccess: () => {
      toast.success("Documento removido.");
      queryClient.invalidateQueries({ queryKey: ['patientDocuments', patientId] });
    },
    onError: (error) => {
      toast.error(`Falha ao excluir: ${error.message}`);
    }
  });
};

export const PatientDocumentsTab = ({ patientId }: PatientDocumentsTabProps) => {
  const { data: documents, isLoading } = usePatientDocuments(patientId);
  const { mutate: uploadFile, isPending: isUploading } = useUploadDocument();
  const { mutate: deleteFile, isPending: isDeleting } = useDeleteDocument(patientId);
  const [previewDoc, setPreviewDoc] = useState<{ path: string, name: string, mimetype?: string } | null>(null);
  const isMobile = useIsMobile();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && patientId) uploadFile({ patientId, file });
    event.target.value = '';
  };

  if (isLoading) {
    return (
      <div className="space-y-4 px-1">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full bg-zinc-100/50 dark:bg-zinc-800/50 rounded-[28px]" />)}
      </div>
    );
  }

  return (
    <div className={cn("animate-fade-in pb-10", isMobile ? "space-y-6" : "space-y-8")}>

      {/* Header Stat & Action */}
      <div className={cn(
        "flex items-center justify-between bg-zinc-50/50 dark:bg-[#0b0b0d] backdrop-blur-xl border border-zinc-200/50 dark:border-white/[0.085] shadow-sm transition-all duration-500",
        isMobile ? "p-3 pl-5 rounded-[22px]" : "p-2 pl-6 rounded-[28px]"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "rounded-xl bg-zinc-100 dark:bg-[#141415] border border-zinc-200/50 dark:border-white/[0.075] flex items-center justify-center text-zinc-400 dark:text-zinc-500",
            isMobile ? "h-9 w-9" : "h-10 w-10"
          )}>
            <FolderOpen className={isMobile ? "h-4 w-4" : "h-4.5 w-4.5"} />
          </div>
          <div className="flex flex-col">
            <span className={cn(
              "text-zinc-900 dark:text-zinc-100 font-black uppercase tracking-widest leading-none",
              isMobile ? "text-[10px]" : "text-[11px]"
            )}>
              {documents?.length || 0} Arquivos
            </span>
            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider mt-0.5">
              Armazenados
            </span>
          </div>
        </div>

        <label htmlFor="file-upload" className="cursor-pointer">
          <Button 
            asChild 
            size={isMobile ? "icon" : "sm"} 
            className={cn(
              "bg-zinc-900 dark:bg-white text-zinc-50 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all font-black uppercase tracking-widest active:scale-95 shadow-lg shadow-zinc-900/10 dark:shadow-none",
              isMobile ? "h-11 w-11 rounded-xl" : "h-11 px-8 rounded-[22px] gap-3 text-[10px]"
            )} 
            disabled={isUploading}
          >
            <div>
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className={cn("stroke-[2.5]", isMobile ? "h-4 w-4" : "h-3.5 w-3.5")} />}
              {!isMobile && (isUploading ? "Processando..." : "Upload de Arquivo")}
            </div>
          </Button>
          <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} disabled={isUploading} />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
        <AnimatePresence mode="popLayout">
          {documents && documents.length > 0 ? (
            documents.map((doc, idx) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
                className={cn(
                  "group flex flex-col sm:flex-row items-center justify-between border border-zinc-200/60 dark:border-white/[0.085] bg-white/60 dark:bg-[#0b0b0d] hover:bg-white dark:hover:bg-[#111113] hover:border-zinc-300 dark:hover:border-white/[0.12] transition-all shadow-sm hover:shadow-xl backdrop-blur-sm gap-4 sm:gap-0",
                  isMobile ? "p-5 rounded-[28px]" : "p-6 rounded-[32px]"
                )}
              >
                <div className="flex items-center gap-4 md:gap-6 min-w-0 w-full sm:w-auto flex-1">
                  <div className={cn(
                    "rounded-[18px] bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)] shrink-0 flex items-center justify-center",
                    isMobile ? "h-12 w-12" : "h-14 w-14"
                  )}>
                    <FileText className={isMobile ? "h-5 w-5" : "h-6 w-6"} />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p 
                      className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate pr-4 tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors cursor-pointer" 
                      onClick={() => setPreviewDoc(doc)}
                    >
                      {doc.name}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider bg-zinc-100 dark:bg-[#141415] border border-zinc-200/50 dark:border-white/[0.065] px-2 py-0.5 rounded-md">
                        {(doc.size / 1024).toFixed(0)} KB
                      </span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold tracking-wider">
                        {format(new Date(doc.created_at), "dd/MM/yyyy")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={cn(
                  "flex gap-2 w-full sm:w-auto sm:pl-6 sm:ml-6 sm:border-l border-zinc-100 dark:border-white/[0.065] justify-end",
                  isMobile && "pt-2 border-t border-zinc-100 dark:border-white/[0.065]"
                )}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPreviewDoc(doc)}
                    className="h-11 w-11 hover:bg-zinc-100 dark:hover:bg-[#18181a] rounded-[14px] text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all active:scale-95 border border-transparent hover:border-zinc-200 dark:hover:border-white/[0.075]"
                    title="Visualizar"
                  >
                    <Eye className="h-4.5 w-4.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteFile(doc.path)}
                    disabled={isDeleting}
                    className="h-11 w-11 hover:bg-rose-500/10 hover:text-rose-500 rounded-[14px] text-zinc-400 transition-all active:scale-95 border border-transparent hover:border-rose-500/20"
                    title="Excluir"
                  >
                    {isDeleting ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Trash2 className="h-4.5 w-4.5" />}
                  </Button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-400 dark:text-zinc-600 border border-dashed border-zinc-200 dark:border-white/[0.085] rounded-[40px] bg-zinc-50/50 dark:bg-[#0b0b0d]">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-[#141415] rounded-full flex items-center justify-center mb-6 shadow-inner border border-zinc-200/50 dark:border-white/[0.075]">
                <DownloadCloud className="h-8 w-8 opacity-20" />
              </div>
              <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">Nenhum Documento</p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-600 mt-2 max-w-[180px] text-center font-bold uppercase tracking-wider">Faça upload de arquivos importantes aqui.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      <DocumentPreviewModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        file={previewDoc}
      />
    </div>
  );
};
