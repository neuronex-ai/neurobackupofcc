type SynapseQuotaRow = {
  allowed: boolean;
  used_count: number;
  limit_count: number;
  remaining_count: number;
  unlocks_at: string | null;
};

export class SynapseQuotaError extends Error {
  status = 429;
  code = "synapse_quota_exceeded";
  quota: SynapseQuotaRow;

  constructor(quota: SynapseQuotaRow) {
    const unlocksAt = quota.unlocks_at ? new Date(quota.unlocks_at) : null;
    const when = unlocksAt && Number.isFinite(unlocksAt.getTime())
      ? unlocksAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
      : "em breve";
    super(`Voce atingiu o limite de ${quota.limit_count} mensagens do Synapse. O uso libera novamente em ${when}.`);
    this.name = "SynapseQuotaError";
    this.quota = quota;
  }
}

export async function consumeSynapseQuota(admin: any, userId: string, limitCount = 15) {
  const { data, error } = await admin
    .rpc("consume_synapse_quota", {
      p_user_id: userId,
      p_limit_count: limitCount,
    })
    .maybeSingle();

  if (error) throw error;

  const quota = {
    allowed: Boolean(data?.allowed),
    used_count: Number(data?.used_count || 0),
    limit_count: Number(data?.limit_count || limitCount),
    remaining_count: Number(data?.remaining_count || 0),
    unlocks_at: data?.unlocks_at || null,
  } satisfies SynapseQuotaRow;

  if (!quota.allowed) throw new SynapseQuotaError(quota);
  return quota;
}

export function isSynapseQuotaError(error: unknown): error is SynapseQuotaError {
  return error instanceof SynapseQuotaError || (error as { name?: string })?.name === "SynapseQuotaError";
}

export function synapseQuotaErrorResponse(error: unknown, headers?: HeadersInit) {
  if (!isSynapseQuotaError(error)) return null;

  return new Response(JSON.stringify({
    error: error.message,
    code: error.code,
    quota: error.quota,
  }), {
    status: error.status,
    headers: {
      ...(headers || {}),
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
