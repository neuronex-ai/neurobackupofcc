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

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Método não permitido." });
  }

  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    return response.status(401).json({ error: "Sessão não encontrada." });
  }

  const body = typeof request.body === "string" ? JSON.parse(request.body) : request.body || {};
  const fileName = String(body.fileName || "").trim();
  const mimeType = String(body.mimeType || "").trim().toLowerCase();
  const sizeBytes = Number(body.sizeBytes || 0);

  if (!fileName || !ALLOWED_MIME_TYPES.has(mimeType)) {
    return response.status(400).json({ error: "Tipo de arquivo não permitido." });
  }
  if (!Number.isSafeInteger(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_FILE_BYTES) {
    return response.status(413).json({ error: "O arquivo deve ter no máximo 20 MB." });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://krewdaklcyzqfxkkgvqr.supabase.co";
  const publishableKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!publishableKey) {
    return response.status(500).json({ error: "Configuração do Supabase ausente no servidor." });
  }

  try {
    const upstream = await fetch(`${supabaseUrl}/functions/v1/r2-create-upload-url`, {
      method: "POST",
      headers: {
        Authorization: authorization,
        apikey: publishableKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fileName, mimeType, sizeBytes }),
    });

    const payload = await upstream.json().catch(() => ({ error: "Resposta inválida do serviço de arquivos." }));
    response.setHeader("Cache-Control", "no-store");
    return response.status(upstream.status).json(payload);
  } catch (error) {
    console.error("r2-sign proxy", error);
    return response.status(502).json({ error: "Não foi possível preparar o upload." });
  }
}
