import { supabase } from "@/integrations/supabase/client";

export interface SignedR2Upload {
  uploadUrl: string;
  objectKey: string;
  bucket: string;
  expiresIn: number;
}

export async function getSignedR2Upload(file: File): Promise<SignedR2Upload> {
  const { data, error } = await supabase.functions.invoke<SignedR2Upload>("r2-create-upload-url", {
    body: { action: "create-upload-url", fileName: file.name, mimeType: file.type, sizeBytes: file.size },
  });

  if (error) {
    throw new Error(error.message || "Nao foi possivel preparar o upload.");
  }

  if (!data?.uploadUrl || !data?.objectKey || !data?.bucket) {
    throw new Error("Nao foi possivel preparar o upload.");
  }

  return data;
}
