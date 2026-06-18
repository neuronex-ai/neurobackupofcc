import { HeadObjectCommand, S3Client } from "npm:@aws-sdk/client-s3";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const authorization = req.headers.get("Authorization");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authorization || "" } } },
  );
  const { documentId } = await req.json();
  const { data: document } = await supabase
    .from("document_files")
    .select("id,bucket,object_key,mime_type,status")
    .eq("id", documentId)
    .maybeSingle();
  if (!document) return Response.json({ error: "Documento não encontrado." }, { status: 404, headers: cors });

  const r2 = new S3Client({
    region: "auto",
    endpoint: Deno.env.get("R2_ENDPOINT")!,
    credentials: {
      accessKeyId: Deno.env.get("R2_ACCESS_KEY_ID")!,
      secretAccessKey: Deno.env.get("R2_SECRET_ACCESS_KEY")!,
    },
  });
  const head = await r2.send(new HeadObjectCommand({ Bucket: document.bucket, Key: document.object_key }));
  const actualSize = Number(head.ContentLength || 0);
  if (actualSize <= 0 || actualSize > 20 * 1024 * 1024) {
    return Response.json({ error: "Arquivo inválido ou maior que 20 MB." }, { status: 400, headers: cors });
  }

  const { data: ready, error } = await supabase
    .from("document_files")
    .update({
      status: "ready",
      size_bytes: actualSize,
      mime_type: head.ContentType || document.mime_type,
      uploaded_at: new Date().toISOString(),
    })
    .eq("id", document.id)
    .select("id,patient_id,category,original_name,mime_type,size_bytes,status,metadata,uploaded_at,created_at")
    .single();
  if (error) return Response.json({ error: error.message }, { status: 400, headers: cors });
  return Response.json({ document: ready }, { headers: cors });
});
