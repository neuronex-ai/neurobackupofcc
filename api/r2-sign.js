import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

const MAX_FILE_BYTES = 20 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
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

function json(response, status, body) {
  response.setHeader("Cache-Control", "no-store");
  return response.status(status).json(body);
}

function sanitizeFileName(fileName) {
  return String(fileName || "arquivo")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .slice(0, 120);
}

function hasNeuroDriveAccess(entitlement) {
  if (!entitlement) return false;
  if (entitlement.isDevAccount) return true;
  if (!entitlement.canUseCurrentAccess) return false;
  return (
    entitlement.rawFeatures?.neurodrive === true ||
    entitlement.internalFlags?.can_use_neurodrive === true
  );
}

async function getEntitlement({ supabaseUrl, publishableKey, authorization }) {
  const upstream = await fetch(`${supabaseUrl}/functions/v1/get-current-entitlement`, {
    method: "POST",
    headers: {
      Authorization: authorization,
      apikey: publishableKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
  const payload = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    const error = new Error(payload?.error || "Nao foi possivel validar a assinatura.");
    error.status = upstream.status;
    throw error;
  }
  return payload;
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return json(response, 405, { error: "Metodo nao permitido." });
  }

  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    return json(response, 401, { error: "Sessao nao encontrada." });
  }

  const body = typeof request.body === "string" ? JSON.parse(request.body) : request.body || {};
  const fileName = String(body.fileName || "").trim();
  const mimeType = String(body.mimeType || "").trim().toLowerCase();
  const sizeBytes = Number(body.sizeBytes || 0);

  if (!fileName || !ALLOWED_MIME_TYPES.has(mimeType)) {
    return json(response, 400, { error: "Tipo de arquivo nao permitido." });
  }
  if (!Number.isSafeInteger(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_FILE_BYTES) {
    return json(response, 413, { error: "O arquivo deve ter no maximo 20 MB." });
  }

  const supabaseUrl = (process.env.VITE_SUPABASE_URL || "https://krewdaklcyzqfxkkgvqr.supabase.co").replace(/\/+$/, "");
  const publishableKey = process.env.VITE_SUPABASE_ANON_KEY;
  const bucket = process.env.R2_BUCKET;
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!publishableKey) {
    return json(response, 500, { error: "Configuracao do Supabase ausente no servidor." });
  }
  if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) {
    return json(response, 500, { error: "Configuracao do armazenamento ausente no servidor." });
  }

  try {
    const entitlement = await getEntitlement({ supabaseUrl, publishableKey, authorization });
    if (!hasNeuroDriveAccess(entitlement)) {
      return json(response, 402, {
        error: entitlement?.message || "Seu plano atual nao inclui o NeuroDrive.",
        code: "feature_not_in_plan",
        requires_upsell: true,
      });
    }

    const objectKey = `uploads/${randomUUID()}-${sanitizeFileName(fileName)}`;
    const r2 = new S3Client({
      region: "auto",
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    });
    const uploadUrl = await getSignedUrl(
      r2,
      new PutObjectCommand({ Bucket: bucket, Key: objectKey, ContentType: mimeType }),
      { expiresIn: 900 },
    );

    return json(response, 200, { uploadUrl, objectKey, bucket, expiresIn: 900 });
  } catch (error) {
    console.error("r2-sign", error);
    return json(response, error.status || 502, {
      error: error.message || "Nao foi possivel preparar o upload.",
    });
  }
}
