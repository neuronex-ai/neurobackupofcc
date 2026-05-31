import { Button } from "@/components/ui/button";
import { usePatientSharedDocuments } from "@/hooks/use-patient-shared-documents";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Download, File, FileImage, FileText, FolderOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PatientDocumentsPanelProps {
  patientId: string;
}

const BUCKET_NAME = 'files_psico';

export const PatientDocumentsPanel = ({ patientId: _ }: PatientDocumentsPanelProps) => {
  const { data: documents, isLoading, error } = usePatientSharedDocuments();

  const handleDownload = async (path: string, _fileName: string) => {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, 60);

    if (error) {
      console.error("Error creating signed URL:", error);
      toast.error("Não foi possível gerar o link de download seguro.");
      return;
    }

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    } else {
      toast.error("Não foi possível gerar o link de download.");
    }
  };

  const getFileIcon = (name: string) => {
    if (name.endsWith('.pdf')) return <FileText className="h-5 w-5" />;
    if (name.match(/\.(jpg|jpeg|png)$/i)) return <FileImage className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive text-sm bg-rose-500/5 rounded-xl mx-4">
        Erro ao carregar documentos.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-primary" />
          Arquivos
        </h2>
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
          {documents?.length || 0} compartilhado(s)
        </span>
      </div>

      <div className="grid gap-3">
        {documents && documents.length > 0 ? (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="group flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className={cn(
                  "p-3 rounded-xl border flex-shrink-0 transition-colors",
                  "bg-blue-500/10 text-blue-400 border-blue-500/20 group-hover:bg-blue-500/20"
                )}>
                  {getFileIcon(doc.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate group-hover:text-blue-200 transition-colors max-w-[200px] sm:max-w-xs">{doc.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5 flex items-center gap-1.5">
                    <span>{(doc.size / 1024).toFixed(1)} KB</span>
                    <span className="w-0.5 h-0.5 bg-white/20 rounded-full" />
                    <span>{format(new Date(doc.created_at), "dd MMM yyyy")}</span>
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDownload(doc.path, doc.name)}
                className="flex-shrink-0 h-10 w-10 rounded-xl text-muted-foreground hover:text-white hover:bg-white/10 border border-transparent hover:border-white/5 transition-all"
                title="Baixar Arquivo"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
            <FolderOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Pasta vazia.</p>
            <p className="text-xs text-muted-foreground/50 mt-1">Seu terapeuta ainda não compartilhou arquivos.</p>
          </div>
        )}
      </div>
    </div>
  );
};
