import { supabase } from "@/integrations/supabase/client";

export interface SignedR2Upload {
  uploadUrl: string;
  objectKey: string;
  bucket: string;
  expiresIn: number;
}

export async function getSignedR2Upload(file: File): Promise<SignedR2Upload> {
  const { data, error } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (error || !token) throw new Error("Sua sessão expirou. Entre novamente.");

  const response = await fetch("/api/r2-sign", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fileName: file.name, mimeType: file.type, sizeBytes: file.size }),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !payload?.uploadUrl || !payload?.objectKey || !payload?.bucket) {
    throw new Error(payload?.error || "Não foi possível preparar o upload.");
  }
  return payload as SignedR2Upload;
}
