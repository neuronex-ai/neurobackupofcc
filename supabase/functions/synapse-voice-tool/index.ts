import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  executeAgentToolV3,
  executeConfirmedMutationV3,
  type AgentToolContextV3,
} from "../synapse-text-fallback/executor-v3.ts";
import {
  loadConversationContext,
  saveConversationContext,
  updateContextFromResult,
} from "../synapse-text-fallback/entity-context.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization,x-client-info,apikey,content-type,x-synapse-gateway-secret",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

const json = (payload: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" },
  });

type PendingAction = {
  kind: "synapse_pending_action";
  actionId: string;
  toolName: string;
  arguments: Record<string, unknown>;
  summary: string;
  status: "pending" | "executing" | "executed" | "cancelled" | "failed";
  createdAt: string;
  expiresAt: string;
  errorMessage?: string;
  updatedAt?: string;
};

type MessageRow = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  attachments?: unknown;
  created_at: string;
};

type PendingReference = { row: MessageRow; action: PendingAction; attachments: any[] };

const clean = (value: unknown, max = 5000) => String(value ?? "").trim().slice(0, max);
const arrayValue = (value: unknown) =>
  Array.isArray(value) ? value : value && typeof value === "object" ? [value] : [];

function parseArgs(value: unknown): Record<string, any> {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value as Record<string, any>;
  if (typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function findPending(rows: MessageRow[]): PendingReference | null {
  for (const row of rows) {
    if (row.role !== "assistant") continue;
    const attachments = arrayValue(row.attachments);
    const action = attachments.find((item: any) =>
      item?.kind === "synapse_pending_action" &&
      item?.status === "pending" &&
      new Date(item.expiresAt).getTime() > Date.now()
    );
    if (action) return { row, action, attachments };
  }
  return null;
}

async function updatePending(admin: any, pending: PendingReference, status: PendingAction["status"], errorMessage?: string) {
  const attachments = pending.attachments.map((item: any) =>
    item?.kind === "synapse_pending_action" && item?.actionId === pending.action.actionId
      ? { ...item, status, updatedAt: new Date().toISOString(), ...(errorMessage ? { errorMessage } : {}) }
      : item
  );
  await admin.from("messages").update({ attachments }).eq("id", pending.row.id);
}

async function loadRows(admin: any, userId: string, sessionId: string) {
  const { data, error } = await admin
    .from("messages")
    .select("id,role,content,attachments,created_at")
    .eq("user_id", userId)
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) throw error;
  return (data || []) as MessageRow[];
}

async function saveMessage(
  admin: any,
  userId: string,
  sessionId: string,
  role: "user" | "assistant" | "system",
  content: string,
  attachments: unknown[] = [],
) {
  const text = clean(content, 20000);
  if (!text) return;

  const { data: recent } = await admin
    .from("messages")
    .select("id,content,created_at")
    .eq("user_id", userId)
    .eq("session_id", sessionId)
    .eq("role", role)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (recent?.content === text && Date.now() - new Date(recent.created_at).getTime() < 8000) return;

  const { error } = await admin.from("messages").insert({
    user_id: userId,
    session_id: sessionId,
    role,
    content: text,
    attachments: attachments.length ? attachments : null,
  });
  if (error) throw error;

  await admin
    .from("chat_sessions")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("user_id", userId);
}

function functionContent(payload: Record<string, unknown>) {
  return JSON.stringify(payload);
}

function humanToolLabel(name: string, args: Record<string, any>) {
  const patient = clean(args.patient_name || args.patientName, 120);
  if (patient) return `${name} para ${patient}`;
  return name.replace(/_/g, " ");
}

async function authenticate(request: Request) {
  const authorization = request.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return { error: json({ error: "Sessao ausente." }, 401) };

  const gatewaySecret = Deno.env.get("SYNAPSE_VOICE_GATEWAY_SECRET") || "";
  if (gatewaySecret && request.headers.get("x-synapse-gateway-secret") !== gatewaySecret) {
    return { error: json({ error: "Gateway nao autorizado." }, 403) };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return { error: json({ error: "Supabase nao configurado para voz." }, 500) };
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data: authData, error: authError } = await userClient.auth.getUser();
  const user = authData.user;
  if (authError || !user) return { error: json({ error: "Sessao invalida." }, 401) };

  return { authorization, admin, user };
}

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (request.method !== "POST") return json({ error: "Metodo nao permitido." }, 405);

  try {
    const auth = await authenticate(request);
    if ("error" in auth) return auth.error;

    const body = await request.json().catch(() => ({}));
    const action = clean(body.action, 80) || "execute_tool";
    const sessionId = clean(body.sessionId || body.session_id, 120);
    if (!sessionId) return json({ error: "Conversa ausente." }, 400);

    const { data: session, error: sessionError } = await auth.admin
      .from("chat_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_id", auth.user.id)
      .maybeSingle();
    if (sessionError || !session) return json({ error: "Conversa nao encontrada." }, 404);

    if (action === "persist_message") {
      const role = clean(body.role, 20);
      if (!["user", "assistant", "system"].includes(role)) return json({ error: "Papel invalido." }, 400);
      await saveMessage(auth.admin, auth.user.id, sessionId, role as "user" | "assistant" | "system", clean(body.content, 20000));
      return json({ ok: true });
    }

    const rows = await loadRows(auth.admin, auth.user.id, sessionId);
    const pending = findPending(rows);
    const toolContext: AgentToolContextV3 = {
      admin: auth.admin,
      userId: auth.user.id,
      sessionId,
      authorization: auth.authorization,
      requestOrigin: request.headers.get("origin") || null,
    };

    if (action === "cancel_pending_action" || clean(body.name, 120) === "cancel_pending_action") {
      if (!pending) {
        return json({
          ok: true,
          content: functionContent({ ok: true, cancelled: false, message: "Nao havia acao pendente para cancelar." }),
        });
      }
      await updatePending(auth.admin, pending, "cancelled");
      const message = "A acao pendente foi cancelada. Nenhuma alteracao foi realizada.";
      await saveMessage(auth.admin, auth.user.id, sessionId, "assistant", message, [{
        kind: "synapse_grounding",
        provider: "deepgram-agent",
        grounded: true,
        toolsUsed: ["cancel_pending_action"],
        generatedAt: new Date().toISOString(),
      }]);
      return json({ ok: true, content: functionContent({ ok: true, cancelled: true, message }) });
    }

    if (action === "confirm_pending_action" || clean(body.name, 120) === "confirm_pending_action") {
      if (!pending) {
        return json({
          ok: true,
          content: functionContent({ ok: false, message: "Nao ha nenhuma acao pendente para confirmar." }),
        });
      }
      await updatePending(auth.admin, pending, "executing");
      const result = await executeConfirmedMutationV3(pending.action, toolContext);
      await updatePending(auth.admin, pending, result.ok ? "executed" : "failed", result.error);
      const loadedContext = await loadConversationContext(auth.admin, auth.user.id, sessionId);
      const nextState = updateContextFromResult(loadedContext.state, pending.action.toolName, pending.action.arguments, result);
      await saveConversationContext(auth.admin, auth.user.id, sessionId, nextState);
      const message = result.ok
        ? result.message || "Acao concluida."
        : `Nao consegui executar: ${result.error || "erro desconhecido"}.`;
      await saveMessage(auth.admin, auth.user.id, sessionId, "assistant", message, [{
        kind: "synapse_grounding",
        provider: "deepgram-agent",
        grounded: result.grounded,
        toolsUsed: [pending.action.toolName],
        recordsFound: result.recordCount || 0,
        generatedAt: new Date().toISOString(),
      }]);
      return json({
        ok: true,
        content: functionContent({
          ok: result.ok,
          message,
          data: result.data || null,
          structuredData: result.structuredData || null,
        }),
        clientAction: result.clientAction || null,
      });
    }

    const name = clean(body.name || body.functionName, 120);
    const args = parseArgs(body.arguments || body.args);
    if (!name) return json({ error: "Ferramenta ausente." }, 400);

    if (name === "synapse_progress_feedback") {
      const task = clean(args.task_label, 160) || "essa consulta";
      const patient = clean(args.patient_name, 120);
      const message = patient
        ? `Vou verificar ${task} de ${patient}.`
        : `Vou verificar ${task}.`;
      return json({ ok: true, content: functionContent({ ok: true, message }) });
    }

    const loadedContext = await loadConversationContext(auth.admin, auth.user.id, sessionId);
    const execution = await executeAgentToolV3(name, args, toolContext, loadedContext.state);
    await saveConversationContext(auth.admin, auth.user.id, sessionId, execution.state);

    const result = execution.result;
    if (result.pendingAction) {
      const pendingAction = result.pendingAction as PendingAction;
      const message = `Antes de executar, preciso da sua confirmacao: ${pendingAction.summary}.`;
      await saveMessage(auth.admin, auth.user.id, sessionId, "assistant", message, [
        pendingAction,
        {
          kind: "synapse_grounding",
          provider: "deepgram-agent",
          grounded: false,
          toolsUsed: [name],
          generatedAt: new Date().toISOString(),
        },
      ]);
    }

    return json({
      ok: true,
      content: functionContent({
        ok: result.ok,
        tool: name,
        label: humanToolLabel(name, execution.resolvedArgs),
        message: result.message || result.error || null,
        data: result.ok ? result.data || null : null,
        error: result.ok ? null : result.error || "Falha ao consultar o sistema.",
        grounded: result.grounded,
        recordCount: result.recordCount || 0,
        confirmationRequired: Boolean(result.pendingAction),
        structuredData: result.structuredData || null,
      }),
      clientAction: result.clientAction || null,
      structuredData: result.structuredData || null,
    });
  } catch (error) {
    console.error("[synapse-voice-tool]", error);
    return json({
      error: error instanceof Error ? error.message : "Falha ao executar ferramenta de voz.",
    }, 500);
  }
});
