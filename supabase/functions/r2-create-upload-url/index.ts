import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "npm:@aws-sdk/client-s3";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  requireRequestEntitlement,
  subscriptionAccessErrorResponse,
} from "../_shared/subscription-access.ts";

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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, { status, headers: corsHeaders });
}

function sanitizeFileName(value: unknown) {
  const fallback = "arquivo";
  const fileName = String(value || fallback)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

  return fileName || fallback;
}

function r2Config() {
  const bucket = Deno.env.get("R2_BUCKET");
  const endpoint = Deno.env.get("R2_ENDPOINT");
  const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
  const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY");

  if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("r2_not_configured");
  }

  return { bucket, endpoint, accessKeyId, secretAccessKey };
}

function r2Client(config: ReturnType<typeof r2Config>) {
  return new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

function userSupabase(req: Request) {
  const authorization = req.headers.get("Authorization");
  if (!authorization) return null;

  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authorization } } },
  );
}

function adminSupabase() {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceKey) throw new Error("service_role_not_configured");

  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    serviceKey,
    { auth: { persistSession: false } },
  );
}

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

function inferLegacyCategory(path: string) {
  const parts = path.split("/");
  const second = String(parts[1] || "");
  if (second === "invoices") return "financial";
  if (second === "chat") return "other";
  if (second === "notes" || second === "personal") return "general";
  if (isUuid(second)) return "patient_attachment";
  return "general";
}

async function inferLegacyPatientId(admin: ReturnType<typeof adminSupabase>, ownerId: string, path: string) {
  const second = String(path.split("/")[1] || "");
  if (!isUuid(second)) return null;

  const { data } = await admin
    .from("patients")
    .select("id")
    .eq("id", second)
    .eq("user_id", ownerId)
    .maybeSingle();

  return data?.id || null;
}

function legacyOriginalName(path: string) {
  const raw = path.split("/").pop() || "arquivo";
  return raw.replace(/^\d+[_-]/, "") || raw;
}

async function backfillFilesPsico(req: Request, body: Record<string, unknown>) {
  const authorization = req.headers.get("Authorization") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const isServiceRole = serviceKey && authorization === `Bearer ${serviceKey}`;
  const admin = adminSupabase();

  let userId: string | null = null;
  if (!isServiceRole) {
    const access = await requireRequestEntitlement(req, "neurodrive");
    userId = access.user.id;
  }

  const limit = Math.min(Math.max(Number(body.limit || 100), 1), 500);
  const dryRun = body.dryRun === true;
  const config = r2Config();
  const client = r2Client(config);

  let query = admin
    .schema("storage")
    .from("objects")
    .select("id,name,owner,metadata,created_at,updated_at")
    .eq("bucket_id", "files_psico")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (userId) query = query.eq("owner", userId);

  const { data: objects, error } = await query;
  if (error) return jsonResponse({ error: error.message }, 400);

  const results: Array<Record<string, unknown>> = [];

  for (const object of objects || []) {
    const ownerId = String(object.owner || object.name.split("/")[0] || "");
    if (!isUuid(ownerId)) {
      results.push({ path: object.name, status: "skipped", reason: "owner_not_resolved" });
      continue;
    }

    const originalName = legacyOriginalName(object.name);
    const objectKey = `documents/${ownerId}/legacy-files-psico/${object.id}-${sanitizeFileName(originalName)}`;

    const existing = await admin
      .from("document_files")
      .select("id,status")
      .eq("object_key", objectKey)
      .maybeSingle();

    if (existing.data?.id) {
      results.push({ path: object.name, status: "exists", documentId: existing.data.id });
      continue;
    }

    const metadata = object.metadata && typeof object.metadata === "object" ? object.metadata as Record<string, unknown> : {};
    const mimeType = String(metadata.mimetype || metadata.mimeType || "application/octet-stream");
    const sizeBytes = Number(metadata.size || metadata.contentLength || 0);
    const category = inferLegacyCategory(object.name);
    const patientId = await inferLegacyPatientId(admin, ownerId, object.name);

    if (dryRun) {
      results.push({ path: object.name, status: "dry_run", ownerId, patientId, category, sizeBytes, mimeType });
      continue;
    }

    const { data: blob, error: downloadError } = await admin.storage.from("files_psico").download(object.name);
    if (downloadError || !blob) {
      results.push({ path: object.name, status: "failed", reason: downloadError?.message || "download_failed" });
      continue;
    }

    await client.send(new PutObjectCommand({
      Bucket: config.bucket,
      Key: objectKey,
      ContentType: mimeType,
      Body: new Uint8Array(await blob.arrayBuffer()),
    }));

    const { data: document, error: insertError } = await admin
      .from("document_files")
      .insert({
        user_id: ownerId,
        patient_id: patientId,
        category,
        bucket: config.bucket,
        object_key: objectKey,
        original_name: originalName,
        mime_type: mimeType,
        size_bytes: sizeBytes || blob.size,
        status: "ready",
        uploaded_at: new Date().toISOString(),
        metadata: {
          source: "files_psico_backfill",
          legacy_storage_bucket: "files_psico",
          legacy_storage_object_id: object.id,
          legacy_storage_path: object.name,
          legacy_storage_owner: object.owner,
          legacy_created_at: object.created_at,
          legacy_updated_at: object.updated_at,
        },
      })
      .select("id")
      .single();

    if (insertError) {
      results.push({ path: object.name, status: "failed", reason: insertError.message });
      continue;
    }

    results.push({ path: object.name, status: "backfilled", documentId: document.id });
  }

  return jsonResponse({
    success: true,
    scope: isServiceRole ? "all" : "current-user",
    dryRun,
    processed: results.length,
    results,
  });
}

async function createUploadUrl(req: Request, body: Record<string, unknown>) {
  const { user } = await requireRequestEntitlement(req, "neurodrive");
  const fileName = sanitizeFileName(body.fileName);
  const mimeType = String(body.mimeType || "application/octet-stream");
  const sizeBytes = Number(body.sizeBytes || 0);

  if (!ALLOWED_TYPES.has(mimeType)) {
    return jsonResponse({ error: "Tipo de arquivo nao permitido." }, 400);
  }

  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_FILE_BYTES) {
    return jsonResponse({ error: "Arquivo invalido ou maior que 20 MB." }, 400);
  }

  const config = r2Config();
  const objectKey = `documents/${user.id}/${crypto.randomUUID()}-${fileName}`;
  const uploadUrl = await getSignedUrl(
    r2Client(config),
    new PutObjectCommand({ Bucket: config.bucket, Key: objectKey, ContentType: mimeType }),
    { expiresIn: 900 },
  );

  return jsonResponse({ uploadUrl, objectKey, bucket: config.bucket, expiresIn: 900 });
}

async function confirmUpload(req: Request, body: Record<string, unknown>) {
  await requireRequestEntitlement(req, "neurodrive");

  const supabase = userSupabase(req);
  if (!supabase) return jsonResponse({ error: "Sessao invalida." }, 401);

  const documentId = String(body.documentId || "");
  if (!documentId) return jsonResponse({ error: "Documento invalido." }, 400);

  const { data: document, error: documentError } = await supabase
    .from("document_files")
    .select("id,bucket,object_key,mime_type,status,metadata")
    .eq("id", documentId)
    .maybeSingle();
  if (documentError) return jsonResponse({ error: documentError.message }, 400);
  if (!document) return jsonResponse({ error: "Documento nao encontrado." }, 404);
  if (document.status === "deleted") return jsonResponse({ error: "Documento removido." }, 410);

  const config = r2Config();
  const head = await r2Client(config).send(new HeadObjectCommand({ Bucket: document.bucket, Key: document.object_key }));
  const actualSize = Number(head.ContentLength || 0);
  if (actualSize <= 0 || actualSize > MAX_FILE_BYTES) {
    return jsonResponse({ error: "Arquivo invalido ou maior que 20 MB." }, 400);
  }

  const currentMetadata =
    document.metadata && typeof document.metadata === "object" && !Array.isArray(document.metadata)
      ? document.metadata
      : {};
  const etag = String(head.ETag || "").replaceAll('"', "");
  const nextMetadata = etag ? { ...currentMetadata, r2_etag: etag } : currentMetadata;

  const { data: ready, error } = await supabase
    .from("document_files")
    .update({
      status: "ready",
      size_bytes: actualSize,
      mime_type: head.ContentType || document.mime_type,
      uploaded_at: new Date().toISOString(),
      metadata: nextMetadata,
    })
    .eq("id", document.id)
    .select("id,patient_id,category,original_name,mime_type,size_bytes,status,metadata,uploaded_at,created_at")
    .single();
  if (error) return jsonResponse({ error: error.message }, 400);

  return jsonResponse({ document: ready });
}

async function createDownloadUrl(req: Request, body: Record<string, unknown>) {
  const supabase = userSupabase(req);
  if (!supabase) return jsonResponse({ error: "Sessao invalida." }, 401);

  const documentId = String(body.documentId || "");
  const disposition = String(body.disposition || "inline");
  if (!documentId) return jsonResponse({ error: "Documento invalido." }, 400);

  const { data: document, error } = await supabase
    .from("document_files")
    .select("bucket,object_key,original_name,mime_type,status,deleted_at")
    .eq("id", documentId)
    .maybeSingle();

  if (error) return jsonResponse({ error: error.message }, 400);
  if (!document || document.status !== "ready" || document.deleted_at) {
    return jsonResponse({ error: "Documento indisponivel." }, 404);
  }

  const config = r2Config();
  const name = encodeURIComponent(document.original_name).replace(/'/g, "%27");
  const safeDisposition = disposition === "attachment" ? "attachment" : "inline";
  const downloadUrl = await getSignedUrl(
    r2Client(config),
    new GetObjectCommand({
      Bucket: document.bucket,
      Key: document.object_key,
      ResponseContentType: document.mime_type,
      ResponseContentDisposition: `${safeDisposition}; filename*=UTF-8''${name}`,
    }),
    { expiresIn: 300 },
  );

  return jsonResponse({ downloadUrl, expiresIn: 300 });
}

async function deleteDocument(req: Request, body: Record<string, unknown>) {
  await requireRequestEntitlement(req, "neurodrive");

  const supabase = userSupabase(req);
  if (!supabase) return jsonResponse({ error: "Sessao invalida." }, 401);

  const documentId = String(body.documentId || "");
  if (!documentId) return jsonResponse({ error: "Documento invalido." }, 400);

  const { data: document, error: documentError } = await supabase
    .from("document_files")
    .select("id,bucket,object_key,status,deleted_at")
    .eq("id", documentId)
    .maybeSingle();
  if (documentError) return jsonResponse({ error: documentError.message }, 400);
  if (!document) return jsonResponse({ error: "Documento nao encontrado." }, 404);
  if (document.deleted_at) return jsonResponse({ success: true, alreadyDeleted: true });

  const config = r2Config();
  await r2Client(config).send(new DeleteObjectCommand({ Bucket: document.bucket, Key: document.object_key }));

  const { error } = await supabase
    .from("document_files")
    .update({ status: "deleted", deleted_at: new Date().toISOString() })
    .eq("id", document.id);
  if (error) return jsonResponse({ error: error.message }, 400);

  return jsonResponse({ success: true });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Metodo nao permitido." }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "create-upload-url");

    if (action === "create-upload-url") return await createUploadUrl(req, body);
    if (action === "confirm-upload") return await confirmUpload(req, body);
    if (action === "create-download-url") return await createDownloadUrl(req, body);
    if (action === "delete-document") return await deleteDocument(req, body);
    if (action === "backfill-files-psico") return await backfillFilesPsico(req, body);

    return jsonResponse({ error: "Acao invalida." }, 400);
  } catch (error) {
    const accessResponse = subscriptionAccessErrorResponse(error);
    if (accessResponse) return accessResponse;

    if (error instanceof Error && error.message === "r2_not_configured") {
      return jsonResponse({ error: "R2 nao configurado no servidor." }, 500);
    }
    if (error instanceof Error && error.message === "service_role_not_configured") {
      return jsonResponse({ error: "Service role nao configurado no servidor." }, 500);
    }

    console.error("r2-create-upload-url:error", error);
    return jsonResponse({ error: "Nao foi possivel processar o documento." }, 500);
  }
});
