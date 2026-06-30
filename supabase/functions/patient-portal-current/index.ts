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
    .select("id,start_time,end_time,type,status,location,google_meet_link,created_at,updated_at,metadata,notes")
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

function normalizeAnamnesisContent(content: unknown) {
  if (Array.isArray(content)) return content;
  if (!content || typeof content !== "object") return [];

  const fields = (content as { fields?: Record<string, unknown> }).fields;
  if (fields && typeof fields === "object") {
    return Object.entries(fields).map(([question, answer]) => ({
      question,
      answer: String(answer ?? ""),
    }));
  }

  return [];
}

function calculateAnamnesisProgress(content: unknown) {
  const items = normalizeAnamnesisContent(content);
  const questions = items.filter((item: any) => !item?.isSection);
  if (!questions.length) return 0;
  const answered = questions.filter((item: any) => String(item?.answer || "").trim().length > 0).length;
  return Math.round((answered / questions.length) * 100);
}

async function loadAnamnesis(context: any) {
  const { data, error } = await supabaseAdmin
    .from("patient_anamneses")
    .select("id,type,content,created_at,updated_at,token_expires_at")
    .eq("patient_id", context.patient.id)
    .order("updated_at", { ascending: false })
    .limit(20);
  if (error) throw error;

  const now = Date.now();
  return {
    anamneses: (data || []).map((record: any) => {
      const progress = calculateAnamnesisProgress(record.content);
      const expiresAt = record.token_expires_at ? new Date(record.token_expires_at).getTime() : 0;
      return {
        id: record.id,
        type: record.type || "Anamnese",
        content: normalizeAnamnesisContent(record.content),
        progress,
        status: progress >= 100 ? "submitted" : expiresAt > now ? "pending" : "expired",
        canEdit: progress < 100 && expiresAt > now,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
        tokenExpiresAt: record.token_expires_at,
      };
    }),
  };
}

async function saveAnamnesis(user: any, context: any, body: Record<string, unknown>) {
  const anamnesisId = String(body.anamnesisId || "");
  const content = Array.isArray(body.content) ? body.content : null;
  if (!anamnesisId || !content) return errorResponse("Anamnese invalida.", 400);

  const { data: record, error: loadError } = await supabaseAdmin
    .from("patient_anamneses")
    .select("id,content,token_expires_at")
    .eq("id", anamnesisId)
    .eq("patient_id", context.patient.id)
    .maybeSingle();
  if (loadError) throw loadError;
  if (!record) return errorResponse("Anamnese nao encontrada.", 404);

  const currentProgress = calculateAnamnesisProgress((record as any).content);
  const expiresAt = (record as any).token_expires_at ? new Date((record as any).token_expires_at).getTime() : 0;
  if (currentProgress >= 100 || expiresAt <= Date.now()) {
    return errorResponse("Esta anamnese esta em modo leitura.", 403);
  }

  const sanitizedContent = content.slice(0, 300).map((item: any) => ({
    question: String(item?.question || "").slice(0, 500),
    answer: String(item?.answer || "").slice(0, 8000),
    isSection: Boolean(item?.isSection),
  }));

  const { data, error } = await supabaseAdmin
    .from("patient_anamneses")
    .update({
      content: sanitizedContent,
      updated_at: new Date().toISOString(),
    })
    .eq("id", anamnesisId)
    .eq("patient_id", context.patient.id)
    .select("id,type,content,created_at,updated_at,token_expires_at")
    .single();
  if (error) throw error;

  const progress = calculateAnamnesisProgress(data.content);
  try {
    await supabaseAdmin.rpc("emit_user_notification", {
      p_user_id: context.professional.id,
      p_event_id: `portal-anamnesis:${anamnesisId}:progress`,
      p_type: progress >= 100 ? "anamnesis_completed" : "anamnesis_progress",
      p_category: "prontuario",
      p_severity: progress >= 100 ? "success" : "info",
      p_title: progress >= 100 ? "Anamnese concluida" : "Anamnese atualizada",
      p_message: `${context.patient.name || "Paciente"} salvou ${progress}% da anamnese pelo Portal do Paciente.`,
      p_action_url: `/pacientes/${context.patient.id}?tab=anamnesis`,
      p_priority: progress >= 100 ? "normal" : "low",
      p_data: {
        sourceModule: "patient_portal",
        eventSource: "patient_portal_anamnesis",
        anamnesisId,
        patientId: context.patient.id,
        actorUserId: user.id,
        progress,
      },
      p_payload: {},
      p_organization_id: null,
    });
  } catch (notifyError) {
    console.warn("[patient-portal-current] anamnesis notification skipped", notifyError);
  }

  return {
    anamnesis: {
      id: data.id,
      type: data.type || "Anamnese",
      content: normalizeAnamnesisContent(data.content),
      progress,
      status: progress >= 100 ? "submitted" : "pending",
      canEdit: progress < 100,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      tokenExpiresAt: data.token_expires_at,
    },
  };
}

async function loadPackages(context: any) {
  const { data, error } = await supabaseAdmin
    .from("patient_packages")
    .select("id,description,total_sessions,sessions_used,price,start_date,end_date,due_day,created_at")
    .eq("patient_id", context.patient.id)
    .eq("user_id", context.professional.id)
    .order("start_date", { ascending: false })
    .limit(30);
  if (error) throw error;
  return { packages: data || [] };
}

async function loadHistory(context: any) {
  const [appointments, documents, goals, mood, billing, anamnesis] = await Promise.all([
    supabaseAdmin
      .from("appointments")
      .select("id,start_time,end_time,type,status,created_at,metadata")
      .eq("patient_id", context.patient.id)
      .eq("user_id", context.professional.id)
      .order("start_time", { ascending: false })
      .limit(30),
    supabaseAdmin
      .from("document_files")
      .select("id,original_name,mime_type,size_bytes,created_at,shared_with_patient_at")
      .eq("patient_id", context.patient.id)
      .eq("user_id", context.professional.id)
      .eq("status", "ready")
      .eq("shared_with_patient", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(30),
    supabaseAdmin
      .from("patient_goals")
      .select("id,description,is_completed,due_date,created_at")
      .eq("patient_id", context.patient.id)
      .eq("user_id", context.professional.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabaseAdmin
      .from("patient_mood_logs")
      .select("id,mood_score,notes,source,created_at")
      .eq("patient_id", context.patient.id)
      .eq("user_id", context.professional.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabaseAdmin
      .from("financial_entries")
      .select("id,title,description,amount,due_date,paid_at,status,created_at,metadata")
      .eq("patient_id", context.patient.id)
      .eq("professional_id", context.professional.id)
      .eq("type", "income")
      .order("created_at", { ascending: false })
      .limit(30),
    supabaseAdmin
      .from("patient_anamneses")
      .select("id,type,content,created_at,updated_at,token_expires_at")
      .eq("patient_id", context.patient.id)
      .order("updated_at", { ascending: false })
      .limit(20),
  ]);

  for (const result of [appointments, documents, goals, mood, billing, anamnesis]) {
    if (result.error) throw result.error;
  }

  const items: any[] = [];
  (appointments.data || []).forEach((row: any) => {
    items.push({
      id: `appointment:${row.id}`,
      sourceId: row.id,
      type: "appointment",
      title: "Consulta",
      description: `${row.type || "Sessao"} - ${row.status || "agendada"}`,
      occurredAt: row.start_time,
      metadata: { status: row.status, type: row.type, syncStatus: row.metadata?.syncStatus || null },
    });
  });
  (documents.data || []).forEach((row: any) => {
    items.push({
      id: `document:${row.id}`,
      sourceId: row.id,
      type: "document",
      title: row.original_name || "Documento compartilhado",
      description: "Documento liberado pelo profissional.",
      occurredAt: row.shared_with_patient_at || row.created_at,
      metadata: { mimeType: row.mime_type, sizeBytes: row.size_bytes },
    });
  });
  (goals.data || []).forEach((row: any) => {
    items.push({
      id: `goal:${row.id}`,
      sourceId: row.id,
      type: "goal",
      title: row.is_completed ? "Meta concluida" : "Meta criada",
      description: row.description,
      occurredAt: row.created_at,
      metadata: { isCompleted: row.is_completed, dueDate: row.due_date },
    });
  });
  (mood.data || []).forEach((row: any) => {
    items.push({
      id: `mood:${row.id}`,
      sourceId: row.id,
      type: "mood",
      title: "Registro de humor",
      description: row.notes || `Humor ${row.mood_score}/5`,
      occurredAt: row.created_at,
      metadata: { moodScore: row.mood_score, source: row.source },
    });
  });
  (billing.data || []).forEach((row: any) => {
    items.push({
      id: `billing:${row.id}`,
      sourceId: row.id,
      type: "billing",
      title: row.title || row.description || "Registro NeuroFinance",
      description: row.status || "financeiro",
      occurredAt: row.paid_at || row.due_date || row.created_at,
      metadata: { amount: row.amount, status: row.status },
    });
  });
  (anamnesis.data || []).forEach((row: any) => {
    const progress = calculateAnamnesisProgress(row.content);
    items.push({
      id: `anamnesis:${row.id}`,
      sourceId: row.id,
      type: "anamnesis",
      title: progress >= 100 ? "Anamnese enviada" : "Anamnese em andamento",
      description: row.type || "Ficha de anamnese",
      occurredAt: row.updated_at || row.created_at,
      metadata: { progress },
    });
  });

  return {
    items: items
      .filter((item) => item.occurredAt)
      .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime())
      .slice(0, 80),
  };
}

async function loadProgress(context: any) {
  const [appointments, goals, mood, documents, packages] = await Promise.all([
    loadAppointments(context),
    loadGoals(context),
    loadMood({ id: context.patient.id }, context, {}),
    supabaseAdmin
      .from("document_files")
      .select("id", { count: "exact", head: true })
      .eq("patient_id", context.patient.id)
      .eq("user_id", context.professional.id)
      .eq("status", "ready")
      .eq("shared_with_patient", true)
      .is("deleted_at", null),
    loadPackages(context),
  ]);
  if (documents.error) throw documents.error;

  const appointmentRows = appointments.appointments || [];
  const goalRows = goals.goals || [];
  const moodRows = mood.logs || [];
  const packageRows = packages.packages || [];
  const completedGoals = goalRows.filter((goal: any) => goal.is_completed).length;
  const attendedSessions = appointmentRows.filter((appointment: any) => {
    const start = new Date(appointment.start_time).getTime();
    return Number.isFinite(start) && start < Date.now() && !String(appointment.status || "").includes("cancelled");
  }).length;
  const activePackages = packageRows.filter((pkg: any) => Number(pkg.total_sessions || 0) > Number(pkg.sessions_used || 0)).length;

  return {
    progress: {
      sessionsTotal: appointmentRows.length,
      attendedSessions,
      goalsTotal: goalRows.length,
      completedGoals,
      sharedDocuments: documents.count || 0,
      moodLogs: moodRows.length,
      activePackages,
      lastMood: moodRows[0] || null,
      nextSteps: goalRows.filter((goal: any) => !goal.is_completed).slice(0, 5),
    },
  };
}

async function loadAppointmentRequests(context: any) {
  const appointments = await loadAppointments(context);
  return {
    requests: (appointments.appointments || []).filter((appointment: any) =>
      appointment?.metadata?.origin === "patient_portal" && appointment?.metadata?.syncStatus === "pending"
    ),
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

async function updateProfile(context: any, body: Record<string, unknown>) {
  const firstName = String(body.firstName || "").trim().replace(/\s+/g, " ").slice(0, 80);
  const lastName = String(body.lastName || "").trim().replace(/\s+/g, " ").slice(0, 120);
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  const genderIdentity = body.genderIdentity === null || body.genderIdentity === undefined
    ? null
    : String(body.genderIdentity || "").trim();
  const avatarUrl = body.avatarUrl === undefined || body.avatarUrl === null
    ? undefined
    : String(body.avatarUrl || "").trim();

  const allowedGenders = new Set([
    "male",
    "female",
    "agender",
    "gender_fluid",
    "non_binary",
    "transgender",
    "prefer_not_to_say",
    "other",
  ]);

  if (fullName.length < 2) return errorResponse("Informe seu nome.", 400);
  if (fullName.length > 160) return errorResponse("Nome muito longo.", 400);
  if (genderIdentity && !allowedGenders.has(genderIdentity)) {
    return errorResponse("Genero invalido.", 400);
  }
  if (avatarUrl !== undefined && avatarUrl && !/^https:\/\/.+/i.test(avatarUrl)) {
    return errorResponse("Foto invalida.", 400);
  }

  const updates: Record<string, unknown> = {
    name: fullName,
    gender_identity: genderIdentity || null,
  };
  if (avatarUrl !== undefined) updates.avatar_url = avatarUrl || null;

  const { error } = await supabaseAdmin
    .from("patients")
    .update(updates)
    .eq("id", context.patient.id)
    .eq("user_id", context.professional.id);
  if (error) throw error;

  return await getPatientPortalContext({
    id: context.patientUserId || "",
    email: context.patient?.email || null,
  });
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
    if (action === "anamnesis") return jsonResponse(await loadAnamnesis(context));
    if (action === "packages") return jsonResponse(await loadPackages(context));
    if (action === "history") return jsonResponse(await loadHistory(context));
    if (action === "progress") return jsonResponse(await loadProgress(context));
    if (action === "appointment_requests") return jsonResponse(await loadAppointmentRequests(context));
    if (action === "goals") return jsonResponse(await loadGoals(context));
    if (action === "save_anamnesis") {
      const result = await saveAnamnesis(user, context, body as Record<string, unknown>);
      return result instanceof Response ? result : jsonResponse(result);
    }
    if (action === "request_appointment") {
      const result = await requestAppointment(context, body as Record<string, unknown>);
      return result instanceof Response ? result : jsonResponse(result);
    }
    if (action === "toggle_goal") {
      const result = await toggleGoal(context, body as Record<string, unknown>);
      return result instanceof Response ? result : jsonResponse(result);
    }
    if (action === "update_profile") {
      const result = await updateProfile({ ...context, patientUserId: user.id }, body as Record<string, unknown>);
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
