export interface PatientCandidate {
  id: string;
  name: string;
  status?: string | null;
  diagnosis?: string | null;
  last_session?: string | null;
  next_session?: string | null;
}

export type PatientResolution =
  | { status: "resolved"; patient: PatientCandidate; candidates: PatientCandidate[] }
  | { status: "ambiguous"; candidates: PatientCandidate[] }
  | { status: "not_found"; candidates: PatientCandidate[] };

const normalize = (value: unknown) => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9\s]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const editDistance = (left: string, right: string) => {
  const rows = left.length + 1;
  const cols = right.length + 1;
  const matrix = Array.from({ length: rows }, () => Array(cols).fill(0));
  for (let i = 0; i < rows; i++) matrix[i][0] = i;
  for (let j = 0; j < cols; j++) matrix[0][j] = j;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }
  return matrix[left.length][right.length];
};

const similarity = (left: string, right: string) => {
  if (!left || !right) return 0;
  const distance = editDistance(left, right);
  return 1 - distance / Math.max(left.length, right.length, 1);
};

const scoreCandidate = (query: string, candidate: PatientCandidate) => {
  const target = normalize(candidate.name);
  if (!query || !target) return 0;
  if (target === query) return 100;
  if (target.startsWith(`${query} `) || query.startsWith(`${target} `)) return 92;
  if (target.includes(query) || query.includes(target)) return 86;

  const queryTokens = new Set(query.split(" ").filter(Boolean));
  const targetTokens = new Set(target.split(" ").filter(Boolean));
  const overlap = [...queryTokens].filter((token) => targetTokens.has(token)).length;
  const tokenScore = overlap / Math.max(queryTokens.size, 1);
  return Math.round(Math.max(similarity(query, target) * 75, tokenScore * 80));
};

export async function resolvePatientByName(
  admin: any,
  userId: string,
  patientName: unknown,
): Promise<PatientResolution> {
  const query = normalize(patientName);
  if (!query) return { status: "not_found", candidates: [] };

  const { data, error } = await admin
    .from("patients")
    .select("id,name,status,diagnosis,last_session,next_session")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) throw error;

  const ranked = ((data || []) as PatientCandidate[])
    .map((patient) => ({ patient, score: scoreCandidate(query, patient) }))
    .filter((item) => item.score >= 55)
    .sort((a, b) => b.score - a.score);

  if (!ranked.length) return { status: "not_found", candidates: [] };

  const best = ranked[0];
  const second = ranked[1];
  const clearlyResolved = best.score >= 86 && (!second || best.score - second.score >= 10);
  if (clearlyResolved) {
    return {
      status: "resolved",
      patient: best.patient,
      candidates: ranked.slice(0, 5).map((item) => item.patient),
    };
  }

  const plausible = ranked.filter((item) => item.score >= Math.max(65, best.score - 8));
  if (plausible.length === 1 && best.score >= 72) {
    return {
      status: "resolved",
      patient: best.patient,
      candidates: [best.patient],
    };
  }

  return {
    status: "ambiguous",
    candidates: plausible.slice(0, 5).map((item) => item.patient),
  };
}

export function formatPatientAmbiguity(candidates: PatientCandidate[]) {
  const options = candidates.map((patient, index) => {
    const details = [
      patient.status ? `status ${patient.status}` : null,
      patient.diagnosis || null,
      patient.next_session ? `próxima consulta ${new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }).format(new Date(patient.next_session))}` : null,
    ].filter(Boolean);
    return `${index + 1}. ${patient.name}${details.length ? ` — ${details.join("; ")}` : ""}`;
  });

  return `Encontrei mais de um paciente possível. Qual deles você quis dizer?\n\n${options.join("\n")}`;
}
