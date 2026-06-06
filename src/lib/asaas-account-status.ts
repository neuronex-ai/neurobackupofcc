export type AsaasApprovalTone =
  | "approved"
  | "pending"
  | "review"
  | "rejected"
  | "missing"
  | "neutral";

export interface AsaasApprovalStage {
  id: string;
  label: string;
  rawStatus: string;
  statusLabel: string;
  tone: AsaasApprovalTone;
  description: string;
}

const STATUS_LABELS: Record<string, string> = {
  APPROVED: "Aprovado",
  PENDING: "Pendente",
  AWAITING_APPROVAL: "Aguardando aprovação",
  AWAITING_ACTION_AUTHORIZATION: "Aguardando ação",
  NOT_SENT: "Não enviado",
  REJECTED: "Reprovado",
  DENIED: "Reprovado",
  EXPIRED: "Expirado",
  EXPIRING_SOON: "Expira em breve",
  UNKNOWN: "Não informado",
};

const STATUS_DESCRIPTIONS: Record<AsaasApprovalTone, string> = {
  approved: "Etapa validada pela Asaas.",
  pending: "Dados enviados ou pendentes de processamento.",
  review: "Aguardando análise cadastral da Asaas.",
  rejected: "A etapa precisa de correção ou reenvio.",
  missing: "Informação ainda não enviada para análise.",
  neutral: "Status aguardando retorno da Asaas.",
};

const normalizeRawStatus = (value: unknown) =>
  String(value || "UNKNOWN")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

export const getAsaasStatusLabel = (value: unknown) => {
  const normalized = normalizeRawStatus(value);
  return STATUS_LABELS[normalized] || normalized.replace(/_/g, " ").toLowerCase();
};

export const getAsaasStatusTone = (value: unknown): AsaasApprovalTone => {
  const normalized = normalizeRawStatus(value);
  if (normalized === "APPROVED") return "approved";
  if (["REJECTED", "DENIED", "EXPIRED"].includes(normalized)) return "rejected";
  if (["AWAITING_APPROVAL", "AWAITING_ACTION_AUTHORIZATION"].includes(normalized)) return "review";
  if (["PENDING", "EXPIRING_SOON"].includes(normalized)) return "pending";
  if (normalized === "NOT_SENT") return "missing";
  return "neutral";
};

const readNested = (source: any, key: string) =>
  key.split(".").reduce((acc, part) => (acc == null ? undefined : acc[part]), source);

const readStatus = (source: any, keys: string[]) => {
  for (const key of keys) {
    const value = key.includes(".") ? readNested(source, key) : source?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
};

export const getAsaasAccountStatusSource = (account: any) => {
  const status = account?.account_status || account?.accountStatus || {};
  const requirements = account?.requirements || {};
  const metadata = account?.metadata || {};

  return {
    ...metadata,
    ...requirements,
    ...status,
    accountStatus: status,
    requirements,
    metadata,
  };
};

export const buildAsaasApprovalStages = (account: any): AsaasApprovalStage[] => {
  const source = getAsaasAccountStatusSource(account);
  const isApproved =
    account?.status === "active" ||
    account?.charges_enabled ||
    account?.payouts_enabled ||
    normalizeRawStatus(readStatus(source, ["generalStatus", "general", "general_status"])) === "APPROVED";

  const stageDefinitions = [
    {
      id: "general",
      label: "Aprovação geral do cadastro",
      keys: [
        "generalStatus",
        "general.status",
        "general",
        "general_status",
        "generalApprovalStatus",
        "general_approval",
        "generalApproval.status",
        "accountStatus.generalStatus",
        "requirements.general",
      ],
    },
    {
      id: "commercial",
      label: "Dados comerciais",
      keys: [
        "commercialInfoStatus",
        "commercialInfo.status",
        "commercial_info.status",
        "commercial_info",
        "commercialInfo",
        "commercial_status",
        "commercial.status",
        "accountStatus.commercialInfoStatus",
        "requirements.commercial_info",
      ],
    },
    {
      id: "bank",
      label: "Dados bancários",
      keys: [
        "bankAccountInfoStatus",
        "bankAccountInfo.status",
        "bank_account_info.status",
        "bank_account_info",
        "bankAccountInfo",
        "bank_status",
        "bank.status",
        "accountStatus.bankAccountInfoStatus",
        "requirements.bank_account_info",
      ],
    },
    {
      id: "billing",
      label: "Dados do boleto",
      keys: [
        "bankSlipInfoStatus",
        "bankSlipInfo.status",
        "bank_slip_info.status",
        "bank_slip_info",
        "bankSlipInfo",
        "bank_slip_status",
        "boletoInfoStatus",
        "boletoInfo.status",
        "boleto_info.status",
        "boleto_info",
        "billingInfoStatus",
        "billingInfo.status",
        "billing_info.status",
        "billing_info",
        "paymentInfoStatus",
        "accountStatus.bankSlipInfoStatus",
        "requirements.bank_slip_info",
        "requirements.boleto_info",
        "requirements.billing_info",
      ],
      fallback: isApproved ? "APPROVED" : undefined,
    },
    {
      id: "documents",
      label: "Documentos",
      keys: [
        "documentStatus",
        "documentsStatus",
        "document.status",
        "documents.status",
        "document_info.status",
        "documents_info.status",
        "document",
        "documents",
        "document_status",
        "documents_status",
        "kycDocumentStatus",
        "identityDocumentStatus",
        "accountStatus.documentStatus",
        "requirements.document",
        "requirements.documents",
        "requirements.document_status",
      ],
      fallback: isApproved ? "APPROVED" : undefined,
    },
  ];

  return stageDefinitions.map((stage) => {
    const rawStatus = normalizeRawStatus(readStatus(source, stage.keys) || stage.fallback);
    const tone = getAsaasStatusTone(rawStatus);

    return {
      id: stage.id,
      label: stage.label,
      rawStatus,
      statusLabel: getAsaasStatusLabel(rawStatus),
      tone,
      description: STATUS_DESCRIPTIONS[tone],
    };
  });
};

export const hasOpenAsaasApprovalStage = (account: any) =>
  buildAsaasApprovalStages(account).some((stage) => stage.tone !== "approved");

export const getAsaasAccountSituation = (account: any) => {
  if (!account?.asaas_account_id) return "Conta não criada";
  if (account?.status === "active") return "Conta aprovada";
  if (account?.status === "restricted" || account?.status === "disabled") return "Conta restrita";
  if (hasOpenAsaasApprovalStage(account)) return "Cadastro em análise";
  return "Aguardando atualização";
};
