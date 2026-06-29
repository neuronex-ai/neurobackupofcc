import {
  corsResponse,
  errorResponse,
  getAuthenticatedUser,
  jsonResponse,
  supabaseAdmin,
} from "../_shared/asaas-client.ts";
import { GetObjectCommand, S3Client } from "npm:@aws-sdk/client-s3";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner";
import {
  getPatientPortalContext,
  requireActivePatientPortal,
} from "../_shared/patient-portal.ts";

async function readBody(req: Request) {
  if (req.method !== "POST") return {};
  return await req.json().catch(() => ({}));
}

async function loadAppointments(context: any) {
  const { data, error } = await supabaseAdmin
    .from("appointments")
    .select("id,start_time,end_time,type,status,location,google_meet_link,created_at,updated_at")
    .eq("patient_id", context.patient.id)
    .eq("user_id", context.professional.id)
    .order("start_time", { ascending: true });
  if (error) throw error;
  return { appointments: data || [] };
}

async function loadDocuments(context: any) {
  const { data, error } = await supabaseAdmin
    .from("document_files")
    .select("id,bucket,object_key,original_name,mime_type,size_bytes,created_at,shared_with_patient_at")
    .eq("patient_id", context.patient.id)
    .eq("user_id", context.professional.id)
    .eq("status", "ready")
    .eq("shared_with_patient", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = data || [];
  const needsSignedUrls = rows.some((doc: any) => doc.bucket && doc.object_key);
  const r2Endpoint = Deno.env.get("R2_ENDPOINT");
  const r2AccessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
  const r2SecretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY");

  if (needsSignedUrls && (!r2Endpoint || !r2AccessKeyId || !r2SecretAccessKey)) {
    throw new Error("R2 nao configurado para assinar documentos do portal.");
  }

  const r2 = needsSignedUrls
    ? new S3Client({
        region: "auto",
        endpoint: r2Endpoint!,
        credentials: {
          accessKeyId: r2AccessKeyId!,
          secretAccessKey: r2SecretAccessKey!,
        },
      })
    : null;

  const documents = await Promise.all(rows.map(async (doc: any) => {
    let signedUrl: string | null = null;
    if (r2 && doc.bucket && doc.object_key) {
      const name = encodeURIComponent(doc.original_name || "documento").replace(/'/g, "%27");
      signedUrl = await getSignedUrl(
        r2,
        new GetObjectCommand({
          Bucket: doc.bucket,
          Key: doc.object_key,
          ResponseContentType: doc.mime_type || undefined,
          ResponseContentDisposition: `inline; filename*=UTF-8''${name}`,
        }),
        { expiresIn: 300 },
      );
    }
    return {
      id: doc.id,
      name: doc.original_name,
      mimeType: doc.mime_type,
      sizeBytes: doc.size_bytes,
      createdAt: doc.created_at,
      sharedAt: doc.shared_with_patient_at,
      signedUrl,
    };
  }));

  return { documents };
}

async function loadBilling(context: any) {
  const [entriesResult, invoicesResult] = await Promise.all([
    supabaseAdmin
      .from("financial_entries")
      .select("id,title,description,amount,due_date,paid_at,status,payment_method,neurofinance_charge_id,created_at,metadata")
      .eq("patient_id", context.patient.id)
      .eq("professional_id", context.professional.id)
      .eq("type", "income")
      .order("due_date", { ascending: false })
      .limit(50),
    supabaseAdmin
      .from("invoices")
      .select("id,invoice_number,amount,status,due_date,created_at,pdf_url,payment_url,nfse_pdf_url,nfse_xml_url")
      .eq("patient_id", context.patient.id)
      .eq("user_id", context.professional.id)
      .order("due_date", { ascending: false })
      .limit(50),
  ]);
  if (entriesResult.error) throw entriesResult.error;
  if (invoicesResult.error) throw invoicesResult.error;

  return {
    entries: entriesResult.data || [],
    invoices: (invoicesResult.data || []).map((invoice: any) => ({
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      amount: invoice.amount,
      status: invoice.status,
      due_date: invoice.due_date,
      created_at: invoice.created_at,
      receipt_url: invoice.pdf_url || null,
      invoice_url: invoice.nfse_pdf_url || invoice.pdf_url || null,
      bank_slip_url: invoice.payment_url || null,
      nfse_xml_url: invoice.nfse_xml_url || null,
    })),
  };
}

async function loadGoals(context: any) {
  const { data, error } = await supabaseAdmin
    .from("patient_goals")
    .select("id,description,is_completed,due_date,created_at")
    .eq("patient_id", context.patient.id)
    .eq("user_id", context.professional.id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return { goals: data || [] };
}

async function loadMood(user: any, context: any, body: Record<string, unknown>) {
  if (body.moodScore !== undefined) {
    const moodScore = Number(body.moodScore);
    const notes = String(body.notes || "").trim().slice(0, 2000);
    if (!Number.isInteger(moodScore) || moodScore < 1 || moodScore > 5) {
      return errorResponse("Informe um humor entre 1 e 5.", 400);
    }

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const existingResult = await supabaseAdmin
      .from("patient_mood_logs")
      .select("id")
      .eq("patient_id", context.patient.id)
      .eq("created_by_user_id", user.id)
      .eq("source", "patient_portal")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString())
      .maybeSingle();
    if (existingResult.error) throw existingResult.error;

    if (existingResult.data?.id) {
      const { error } = await supabaseAdmin
        .from("patient_mood_logs")
        .update({ mood_score: moodScore, notes })
        .eq("id", existingResult.data.id);
      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin.from("patient_mood_logs").insert({
        user_id: context.professional.id,
        patient_id: context.patient.id,
        mood_score: moodScore,
        notes,
        source: "patient_portal",
        created_by_user_id: user.id,
      });
      if (error) throw error;
    }
  }

  const { data, error } = await supabaseAdmin
    .from("patient_mood_logs")
    .select("id,mood_score,notes,source,created_at")
    .eq("patient_id", context.patient.id)
    .eq("user_id", context.professional.id)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;

  return {
    logs: data || [],
    today: (data || []).find((log: any) => {
      const created = new Date(log.created_at);
      const now = new Date();
      return created.toDateString() === now.toDateString() && log.source === "patient_portal";
    }) || null,
  };
}

async function requestAppointment(context: any, body: Record<string, unknown>) {
  const startTime = new Date(String(body.startTime || ""));
  const type = String(body.type || "online");

  if (!Number.isFinite(startTime.getTime()) || startTime.getTime() <= Date.now()) {
    return errorResponse("Escolha um horario futuro.", 400);
  }
  if (!["online", "presencial"].includes(type)) {
    return errorResponse("Modalidade invalida.", 400);
  }

  const endTime = new Date(startTime.getTime() + 50 * 60 * 1000);
  const { data, error } = await supabaseAdmin
    .from("appointments")
    .insert({
      user_id: context.professional.id,
      patient_id: context.patient.id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      type,
      status: "unscored",
      notes: "Solicitacao via Portal do Paciente",
      metadata: {
        kind: "session",
        sessionType: "acompanhamento",
        modality: type,
        durationMinutes: 50,
        origin: "patient_portal",
        syncStatus: "pending",
      },
    })
    .select("id,start_time,end_time,type,status,location,google_meet_link,created_at,updated_at")
    .single();

  if (error) throw error;
  return { appointment: data };
}

async function toggleGoal(context: any, body: Record<string, unknown>) {
  const goalId = String(body.goalId || "");
  const isCompleted = Boolean(body.isCompleted);
  if (!goalId) return errorResponse("Meta invalida.", 400);

  const { data, error } = await supabaseAdmin
    .from("patient_goals")
    .update({ is_completed: isCompleted })
    .eq("id", goalId)
    .eq("patient_id", context.patient.id)
    .eq("user_id", context.professional.id)
    .select("id,description,is_completed,due_date,created_at")
    .single();

  if (error) throw error;
  return { goal: data };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return corsResponse();
  if (req.method !== "GET" && req.method !== "POST") return errorResponse("Metodo nao permitido.", 405);

  try {
    const body = await readBody(req);
    const action = String((body as any).action || "current");

    if (action === "current") {
      const user = await getAuthenticatedUser(req);
      const context = await getPatientPortalContext({ id: user.id, email: user.email });
      return jsonResponse(context);
    }

    const { user, context, response } = await requireActivePatientPortal(req);
    if (response) return response;

    if (action === "appointments") return jsonResponse(await loadAppointments(context));
    if (action === "documents") return jsonResponse(await loadDocuments(context));
    if (action === "billing") return jsonResponse(await loadBilling(context));
    if (action === "goals") return jsonResponse(await loadGoals(context));
    if (action === "request_appointment") {
      const result = await requestAppointment(context, body as Record<string, unknown>);
      return result instanceof Response ? result : jsonResponse(result);
    }
    if (action === "toggle_goal") {
      const result = await toggleGoal(context, body as Record<string, unknown>);
      return result instanceof Response ? result : jsonResponse(result);
    }
    if (action === "mood") {
      const result = await loadMood(user, context, body as Record<string, unknown>);
      return result instanceof Response ? result : jsonResponse(result);
    }

    return errorResponse("Acao do portal desconhecida.", 400);
  } catch (error) {
    console.error("[patient-portal-current]", error);
    return errorResponse(error instanceof Error ? error.message : "Nao foi possivel carregar seu portal.", 500);
  }
});
