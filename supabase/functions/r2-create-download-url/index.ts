import { GetObjectCommand, S3Client } from "npm:@aws-sdk/client-s3";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const authorization = req.headers.get("Authorization");
  if (!authorization) return Response.json({ error: "Sessão inválida." }, { status: 401, headers: cors });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authorization } } },
  );
  const { documentId, disposition = "inline" } = await req.json();
  const { data: document } = await supabase
    .from("document_files")
    .select("bucket,object_key,original_name,mime_type,status,deleted_at")
    .eq("id", documentId)
    .maybeSingle();

  if (!document || document.status !== "ready" || document.deleted_at) {
    return Response.json({ error: "Documento indisponível." }, { status: 404, headers: cors });
  }

  const r2 = new S3Client({
    region: "auto",
    endpoint: Deno.env.get("R2_ENDPOINT")!,
    credentials: {
      accessKeyId: Deno.env.get("R2_ACCESS_KEY_ID")!,
      secretAccessKey: Deno.env.get("R2_SECRET_ACCESS_KEY")!,
    },
  });
  const name = encodeURIComponent(document.original_name).replace(/'/g, "%27");
  const downloadUrl = await getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: document.bucket,
      Key: document.object_key,
      ResponseContentType: document.mime_type,
      ResponseContentDisposition: `${disposition === "attachment" ? "attachment" : "inline"}; filename*=UTF-8''${name}`,
    }),
    { expiresIn: 300 },
  );

  return Response.json({ downloadUrl, expiresIn: 300 }, { headers: cors });
});
