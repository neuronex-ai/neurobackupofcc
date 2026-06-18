import { PutObjectCommand, S3Client } from "npm:@aws-sdk/client-s3";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const body = await req.json();
  const fileName = String(body.fileName || "arquivo")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .slice(0, 120);
  const mimeType = String(body.mimeType || "application/octet-stream");
  const bucket = Deno.env.get("R2_BUCKET")!;
  const objectKey = `uploads/${crypto.randomUUID()}-${fileName}`;

  const r2 = new S3Client({
    region: "auto",
    endpoint: Deno.env.get("R2_ENDPOINT")!,
    credentials: {
      accessKeyId: Deno.env.get("R2_ACCESS_KEY_ID")!,
      secretAccessKey: Deno.env.get("R2_SECRET_ACCESS_KEY")!,
    },
  });
  const uploadUrl = await getSignedUrl(
    r2,
    new PutObjectCommand({ Bucket: bucket, Key: objectKey, ContentType: mimeType }),
    { expiresIn: 900 },
  );

  return new Response(JSON.stringify({ uploadUrl, objectKey, bucket, expiresIn: 900 }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
