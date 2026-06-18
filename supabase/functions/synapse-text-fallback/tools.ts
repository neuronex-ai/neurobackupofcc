type JsonSchema = Record<string, unknown>;

const objectSchema = (
  properties: Record<string, JsonSchema>,
  required: string[] = [],
): JsonSchema => ({
  type: "object",
  properties,
  ...(required.length ? { required } : {}),
  additionalProperties: false,
});

const fn = (name: string, description: string, parameters: JsonSchema) => ({
  type: "function",
  function: { name, description, parameters },
});

export const AGENT_TOOLS = [
  fn(
    "list_patients",
    "Lista pacientes reais do profissional. Use sempre para perguntas sobre pacientes ativos, pendentes, quantidade ou visão geral da base.",
    objectSchema({
      status: { type: "string", enum: ["active", "pending", "inactive", "all"] },
      limit: { type: "integer", minimum: 1, maximum: 50 },
    }),
  ),
  fn(
    "search_patients",
    "Busca pacientes reais por nome. Use antes de pedir um ID ao usuário e antes de qualquer consulta específica sobre alguém.",
    objectSchema({
      query: { type: "string", minLength: 1 },
      limit: { type: "integer", minimum: 1, maximum: 20 },
    }, ["query"]),
  ),
  fn(
    "get_patient_details",
    "Obtém o cadastro real de um paciente identificado, incluindo contato, situação clínica resumida, risco e medicações registradas.",
    objectSchema({ patient_id: { type: "string" } }, ["patient_id"]),
  ),
  fn(
    "get_clinical_history",
    "Consulta anotações e resumos reais do prontuário de um paciente. Use somente quando o usuário solicitar histórico, última sessão ou evolução.",
    objectSchema({
      patient_id: { type: "string" },
      keywords: { type: "string" },
      limit: { type: "integer", minimum: 1, maximum: 10 },
    }, ["patient_id"]),
  ),
  fn(
    "get_calendar",
    "Consulta compromissos reais da agenda em um período. Pode filtrar por paciente depois de localizá-lo.",
    objectSchema({
      start_date: { type: "string", description: "Data ISO YYYY-MM-DD" },
      end_date: { type: "string", description: "Data ISO YYYY-MM-DD" },
      patient_id: { type: "string" },
      limit: { type: "integer", minimum: 1, maximum: 50 },
    }, ["start_date", "end_date"]),
  ),
  fn(
    "find_available_slots",
    "Calcula horários livres reais com base nos compromissos já cadastrados.",
    objectSchema({
      start_date: { type: "string", description: "Data ISO YYYY-MM-DD" },
      end_date: { type: "string", description: "Data ISO YYYY-MM-DD" },
      duration_minutes: { type: "integer", minimum: 15, maximum: 240 },
      preferred_period: { type: "string", enum: ["morning", "afternoon", "evening", "any"] },
    }, ["start_date"]),
  ),
  fn(
    "get_financial_summary",
    "Consulta receitas, despesas, saldo gerencial e pendências reais em um período.",
    objectSchema({
      start_date: { type: "string", description: "Data ISO YYYY-MM-DD" },
      end_date: { type: "string", description: "Data ISO YYYY-MM-DD" },
    }),
  ),
  fn(
    "list_financial_entries",
    "Lista lançamentos financeiros gerenciais reais, com filtros opcionais.",
    objectSchema({
      start_date: { type: "string" },
      end_date: { type: "string" },
      entry_type: { type: "string", enum: ["income", "expense", "all"] },
      status: { type: "string" },
      limit: { type: "integer", minimum: 1, maximum: 50 },
    }),
  ),
  fn(
    "list_personal_notes",
    "Lista notas reais do NeuroNotes pertencentes ao profissional.",
    objectSchema({
      query: { type: "string" },
      limit: { type: "integer", minimum: 1, maximum: 20 },
    }),
  ),
  fn(
    "list_documents",
    "Lista metadados de documentos privados armazenados no cofre R2. Não lê o conteúdo do arquivo.",
    objectSchema({
      patient_id: { type: "string" },
      category: { type: "string" },
      limit: { type: "integer", minimum: 1, maximum: 30 },
    }),
  ),
  fn(
    "request_interface_action",
    "Solicita ao aplicativo uma ação visual estruturada. Nunca envie rotas, URLs ou seletores.",
    objectSchema({
      action: {
        type: "string",
        enum: [
          "navigate",
          "open_patient",
          "open_patient_record",
          "open_daily_schedule",
          "scroll_to_appointment",
          "highlight_element",
          "open_modal"
        ],
      },
      target: {
        type: "string",
        enum: ["dashboard", "agenda", "patients", "finance", "notes", "teleconsultation", "synapse"],
      },
      patient_id: { type: "string" },
      appointment_id: { type: "string" },
      date: { type: "string" },
      element: {
        type: "string",
        enum: ["next_appointment", "daily_schedule", "patient_header", "financial_balance"],
      },
      modal: {
        type: "string",
        enum: ["new_appointment", "new_patient", "new_transaction", "patient_details"],
      },
      reason: { type: "string" },
    }, ["action"]),
  ),
  fn(
    "create_patient",
    "Prepara o cadastro de um paciente. O servidor sempre exigirá uma confirmação separada antes de gravar.",
    objectSchema({
      name: { type: "string" },
      email: { type: "string" },
      phone: { type: "string" },
      cpf: { type: "string" },
      diagnosis: { type: "string" },
      notes: { type: "string" },
      birth_date: { type: "string" },
      address: { type: "string" },
      emergency_contact: { type: "string" },
    }, ["name"]),
  ),
  fn(
    "update_patient",
    "Prepara alterações no cadastro de um paciente. O servidor sempre exigirá confirmação separada.",
    objectSchema({
      patient_id: { type: "string" },
      patient_name: { type: "string" },
      name: { type: "string" },
      email: { type: "string" },
      phone: { type: "string" },
      diagnosis: { type: "string" },
      notes: { type: "string" },
      birth_date: { type: "string" },
      address: { type: "string" },
      emergency_contact: { type: "string" },
      status: { type: "string", enum: ["active", "pending", "inactive"] },
    }, ["patient_id"]),
  ),
  fn(
    "create_session_note",
    "Prepara uma anotação de prontuário. Exige confirmação separada antes de gravar.",
    objectSchema({
      patient_id: { type: "string" },
      patient_name: { type: "string" },
      notes: { type: "string" },
      appointment_id: { type: "string" },
    }, ["patient_id", "notes"]),
  ),
  fn(
    "create_appointment",
    "Prepara um novo agendamento. Exige confirmação separada antes de gravar.",
    objectSchema({
      patient_id: { type: "string" },
      patient_name: { type: "string" },
      datetime: { type: "string", description: "Data/hora local de Brasília em ISO" },
      duration_minutes: { type: "integer", minimum: 15, maximum: 240 },
      appointment_type: { type: "string", enum: ["presencial", "online", "block"] },
      notes: { type: "string" },
    }, ["datetime"]),
  ),
  fn(
    "reschedule_appointment",
    "Prepara a remarcação de uma consulta. Exige confirmação separada.",
    objectSchema({
      appointment_id: { type: "string" },
      patient_name: { type: "string" },
      new_datetime: { type: "string" },
      new_duration_minutes: { type: "integer", minimum: 15, maximum: 240 },
    }, ["appointment_id", "new_datetime"]),
  ),
  fn(
    "cancel_appointment",
    "Prepara o cancelamento de uma consulta. Exige confirmação separada.",
    objectSchema({
      appointment_id: { type: "string" },
      patient_name: { type: "string" },
      reason: { type: "string" },
    }, ["appointment_id"]),
  ),
  fn(
    "create_financial_entry",
    "Prepara um lançamento gerencial de receita ou despesa. Exige confirmação separada.",
    objectSchema({
      title: { type: "string" },
      description: { type: "string" },
      amount: { type: "number", exclusiveMinimum: 0 },
      entry_type: { type: "string", enum: ["income", "expense"] },
      patient_id: { type: "string" },
      date: { type: "string" },
      category: { type: "string" },
    }, ["title", "amount", "entry_type"]),
  ),
] as const;

export const MUTATING_TOOLS = new Set([
  "create_patient",
  "update_patient",
  "create_session_note",
  "create_appointment",
  "reschedule_appointment",
  "cancel_appointment",
  "create_financial_entry",
]);

export const SYSTEM_DATA_TOOLS = new Set([
  "list_patients",
  "search_patients",
  "get_patient_details",
  "get_clinical_history",
  "get_calendar",
  "find_available_slots",
  "get_financial_summary",
  "list_financial_entries",
  "list_personal_notes",
  "list_documents",
]);
