const SUPPORT_PHONE = "5547988730611";

export const getNeuroFinanceSyncErrorMessage = (message?: string | null) => {
  const value = String(message || "").trim();
  if (!value) return "Não foi possível atualizar a conta neste momento.";

  const lower = value.toLowerCase();
  if (
    lower.includes("chave de api") ||
    lower.includes("unauthorized") ||
    lower.includes("não foi possível acessar") ||
    lower.includes("n?o foi poss?vel acessar")
  ) {
    return "Não foi possível validar a conexão com a conta Asaas.";
  }

  return value
    .replace(/N\?o/gi, "Não")
    .replace(/poss\?vel/gi, "possível")
    .replace(/situa\?\?o/gi, "situação");
};

export const buildNeuroFinanceSupportUrl = ({
  professionalName,
  professionalEmail,
  userId,
  accountId,
  error,
  occurredAt,
}: {
  professionalName?: string | null;
  professionalEmail?: string | null;
  userId?: string | null;
  accountId?: string | null;
  error?: string | null;
  occurredAt?: string | null;
}) => {
  const timestamp = occurredAt ? new Date(occurredAt) : new Date();
  const formattedAt = Number.isNaN(timestamp.getTime())
    ? new Date().toLocaleString("pt-BR")
    : timestamp.toLocaleString("pt-BR");

  const message = [
    "Olá! Preciso de ajuda com a conexão do NeuroFinance.",
    "",
    `Profissional: ${professionalName || "Não informado"}`,
    `E-mail: ${professionalEmail || "Não informado"}`,
    `Usuário: ${userId || "Não informado"}`,
    `Conta financeira: ${accountId || "Não informada"}`,
    `Problema: ${getNeuroFinanceSyncErrorMessage(error)}`,
    `Identificado em: ${formattedAt}`,
    "",
    "Podem verificar a subconta Asaas e orientar a recuperação da conexão?",
  ].join("\n");

  return `https://wa.me/${SUPPORT_PHONE}?text=${encodeURIComponent(message)}`;
};
