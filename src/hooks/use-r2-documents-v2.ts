import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getSignedR2Upload } from "@/lib/r2-upload-signing";

export type DocumentCategory =
  | "general"
  | "patient_attachment"
  | "anamnesis_import"
  | "session_document"
  | "financial"
  | "other";

export interface DocumentFile {
  id: string;
  patient_id: string | null;
  category: DocumentCategory;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  status: "pending_upload" | "ready" | "failed" | "deleted";
  metadata: Record<string, unknown>;
  uploaded_at: string | null;
  created_at: string;
}

interface UploadInput {
  file: File;
  patientId?: string | null;
  category?: DocumentCategory;
  metadata?: Record<string, unknown>;
}

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/rtf",
  "text/plain",
  "text/csv",
]);

const firstDocument = (value: unknown): DocumentFile | null => {
  if (Array.isArray(value)) return (value[0] as DocumentFile | undefined) ?? null;
  return value && typeof value === "object" ? (value as DocumentFile) : null;
};

export function useR2DocumentsV2(patientId?: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ["r2-documents", patientId ?? "all"];

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey }),
      queryClient.invalidateQueries({ queryKey: ["r2-document-usage"] }),
    ]);
  };

  const documents = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from("document_files")
        .select("id,patient_id,category,original_name,mime_type,size_bytes,status,metadata,uploaded_at,created_at")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (patientId) query = query.eq("patient_id", patientId);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as DocumentFile[];
    },
  });

  const usage = useQuery({
    queryKey: ["r2-document-usage"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_document_storage_usage");
      if (error) throw error;
      const row = data?.[0] ?? { total_bytes: 0, file_count: 0 };
      return { totalBytes: Number(row.total_bytes), fileCount: Number(row.file_count) };
    },
  });

  const upload = useMutation({
    mutationFn: async ({ file, patientId: targetPatientId, category = "general", metadata = {} }: UploadInput) => {
      if (!ALLOWED_TYPES.has(file.type)) throw new Error("Este tipo de arquivo ainda não é permitido.");
      if (file.size <= 0 || file.size > MAX_FILE_BYTES) throw new Error("O arquivo deve ter no máximo 20 MB.");

      const signed = await getSignedR2Upload(file);
      const { data: preparedValue, error: prepareError } = await supabase.rpc("prepare_document_upload", {
        p_patient_id: targetPatientId ?? null,
        p_category: category,
        p_bucket: signed.bucket,
        p_object_key: signed.objectKey,
        p_original_name: file.name,
        p_mime_type: file.type,
        p_size_bytes: file.size,
        p_metadata: metadata,
      });
      const prepared = firstDocument(preparedValue);
      if (prepareError || !prepared) throw prepareError ?? new Error("Não foi possível registrar o documento.");

      const uploadResponse = await fetch(signed.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadResponse.ok) {
        await supabase.from("document_files").update({ status: "failed" }).eq("id", prepared.id);
        throw new Error("O armazenamento recusou o arquivo. Verifique a política CORS do bucket R2.");
      }

      const { data: ready, error: readyError } = await supabase
        .from("document_files")
        .update({
          status: "ready",
          uploaded_at: new Date().toISOString(),
          metadata: { ...metadata, r2_etag: uploadResponse.headers.get("etag") },
        })
        .eq("id", prepared.id)
        .select("id,patient_id,category,original_name,mime_type,size_bytes,status,metadata,uploaded_at,created_at")
        .single();
      if (readyError) throw readyError;
      return ready as DocumentFile;
    },
    onSuccess: refresh,
  });

  return { documents, usage, upload };
}
