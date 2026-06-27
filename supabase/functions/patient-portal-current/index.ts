import {
  corsResponse,
  errorResponse,
  getAuthenticatedUser,
  jsonResponse,
  supabaseAdmin,
} from "../_shared/asaas-client.ts";
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

  const documents = await Promise.all((data || []).map(async (doc: any) => {
    let signedUrl: string | null = null;
    if (doc.bucket && doc.object_key) {
      const signed = await supabaseAdmin.storage.from(doc.bucket).createSignedUrl(doc.object_key, 60 * 5);
      signedUrl = signed.data?.signedUrl || null;
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
      .select("id,invoice_number,amount,status,due_date,created_at,receipt_url,invoice_url,bank_slip_url")
      .eq("patient_id", context.patient.id)
      .eq("user_id", context.professional.id)
      .order("due_date", { ascending: false })
      .limit(50),
  ]);
  if (entriesResult.error) throw entriesResult.error;
  if (invoicesResult.error) throw invoicesResult.error;

  return {
    entries: entriesResult.data || [],
    invoices: invoicesResult.data || [],
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
