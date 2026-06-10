export type OutgoingKind = "pix_qr_payment" | "payout_pix" | "payout_bank";

export const OUTGOING_CONSULTATION_TTL_MS = 10 * 60 * 1000;

export function cents(value: unknown) {
    return Math.max(0, Math.round(Number(value || 0) * 100));
}

export function isExpired(record: any) {
    return !record?.consultation_expires_at ||
        new Date(record.consultation_expires_at).getTime() <= Date.now();
}

export function providerReceiptUrl(payload: any) {
    return payload?.transactionReceiptUrl ||
        payload?.receiptUrl ||
        payload?.paymentReceiptUrl ||
        null;
}

export function normalizeTransferStatus(status?: string) {
    const value = String(status || "PENDING").toUpperCase();
    if (value === "DONE") return "paid";
    if (value === "FAILED") return "failed";
    if (value === "CANCELLED" || value === "CANCELED") return "canceled";
    if (value === "BANK_PROCESSING") return "in_transit";
    return "pending";
}

export function normalizePixTransactionStatus(status?: string) {
    const value = String(status || "REQUESTED").toUpperCase();
    if (value === "DONE") return "paid";
    if (value === "REFUSED" || value === "FAILED") return "failed";
    if (value === "CANCELLED" || value === "CANCELED") return "canceled";
    if (value === "SCHEDULED") return "pending";
    return "in_transit";
}

export function detectPixKeyType(rawValue: unknown): "CPF" | "CNPJ" | "EMAIL" | "PHONE" | "EVP" {
    const value = String(rawValue || "").trim();
    const digits = value.replace(/\D/g, "");
    if (value.includes("@")) return "EMAIL";
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
        return "EVP";
    }
    if (digits.length === 11 && !value.startsWith("+")) return "CPF";
    if (digits.length === 14) return "CNPJ";
    return "PHONE";
}

export function normalizePixKeyForProvider(rawValue: unknown, type = detectPixKeyType(rawValue)) {
    const value = String(rawValue || "").trim();
    if (type === "CPF" || type === "CNPJ") return value.replace(/\D/g, "");
    if (type === "PHONE") {
        const digits = value.replace(/\D/g, "");
        return value.startsWith("+") ? `+${digits}` : digits.length >= 12 ? `+${digits}` : value;
    }
    return value;
}

export function normalizePixQrConsultation(raw: any) {
    const receiver = raw?.receiver || {};
    const totalValue = Number(raw?.totalValue ?? raw?.value ?? 0);
    return {
        payload: String(raw?.payload || ""),
        type: String(raw?.type || ""),
        transactionOriginType: String(raw?.transactionOriginType || ""),
        pixKey: String(raw?.pixKey || ""),
        conciliationIdentifier: String(raw?.conciliationIdentifier || ""),
        dueDate: raw?.dueDate || null,
        expirationDate: raw?.expirationDate || null,
        description: raw?.description || null,
        value: Number.isFinite(totalValue) ? totalValue : 0,
        canBePaid: raw?.canBePaid === true,
        cannotBePaidReason: raw?.cannotBePaidReason || null,
        canBePaidWithDifferentValue: raw?.canBePaidWithDifferentValue === true,
        receiver: {
            name: receiver?.name || receiver?.tradingName || null,
            tradingName: receiver?.tradingName || null,
            cpfCnpj: receiver?.cpfCnpj || null,
            ispb: receiver?.ispb || null,
            ispbName: receiver?.ispbName || null,
            accountType: receiver?.accountType || null,
        },
    };
}

export function validatePixQrConsultation(consultation: ReturnType<typeof normalizePixQrConsultation>) {
    const missing: string[] = [];
    if (!consultation.payload) missing.push("payload");
    if (!consultation.receiver.name) missing.push("receiver.name");
    if (!consultation.receiver.cpfCnpj) missing.push("receiver.cpfCnpj");
    if (!consultation.receiver.ispbName && !consultation.receiver.ispb) missing.push("receiver.institution");
    if (!consultation.canBePaidWithDifferentValue && consultation.value <= 0) missing.push("value");
    return missing;
}

export function outgoingResponse(record: any) {
    return {
        id: record.id,
        kind: record.kind,
        status: record.status,
        amount: Number(record.amount || 0) / 100,
        fee: Number(record.fee_amount || 0) / 100,
        availableBalance: record.available_balance_at_review == null
            ? null
            : Number(record.available_balance_at_review) / 100,
        destinationSummary: record.destination_summary,
        destination: record.destination_payload || {},
        expiresAt: record.consultation_expires_at,
        providerOperationId: record.provider_operation_id,
        providerStatus: record.provider_status,
        receiptUrl: record.receipt_url,
        payoutId: record.payout_id,
    };
}
