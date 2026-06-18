import { DeleteObjectCommand, S3Client } from "npm:@aws-sdk/client-s3";
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
    .select("id,bucket,object_key,status,deleted_at")
    .eq("id", documentId)
    .maybeSingle();
  if (!document) return Response.json({ error: "Documento não encontrado." }, { status: 404, headers: cors });
  if (document.deleted_at) return Response.json({ success: true, alreadyDeleted: true }, { headers: cors });

  const r2 = new S3Client({
    region: "auto",
    endpoint: Deno.env.get("R2_ENDPOINT")!,
    credentials: {
      accessKeyId: Deno.env.get("R2_ACCESS_KEY_ID")!,
      secretAccessKey: Deno.env.get("R2_SECRET_ACCESS_KEY")!,
    },
  });
  await r2.send(new DeleteObjectCommand({ Bucket: document.bucket, Key: document.object_key }));

  const { error } = await supabase
    .from("document_files")
    .update({ status: "deleted", deleted_at: new Date().toISOString() })
    .eq("id", document.id);
  if (error) return Response.json({ error: error.message }, { status: 400, headers: cors });
  return Response.json({ success: true }, { headers: cors });
});
