import * as bcryptModule from "https://esm.sh/bcryptjs@2.4.3";

import { supabaseAdmin } from "./asaas-client.ts";

interface BcryptRuntime {
    compare(value: string, hash: string): Promise<boolean>;
}

const bcrypt = (bcryptModule as unknown as { default: BcryptRuntime }).default;

export function isValidFinancialPinFormat(pin?: string) {
    return typeof pin === "string" && /^\d{6}$/.test(pin);
}

export async function verifyFinancialPin(userId: string, pin?: string) {
    if (!isValidFinancialPinFormat(pin)) {
        return {
            isValid: false,
            code: "INVALID_PIN_FORMAT",
            message: "Digite o PIN de 6 dígitos.",
        };
    }

    const { data: settings, error } = await supabaseAdmin
        .from("user_financial_settings")
        .select("pin_hash")
        .eq("user_id", userId)
        .maybeSingle();

    if (error) throw error;
    if (!settings?.pin_hash) {
        return {
            isValid: false,
            code: "PIN_NOT_CONFIGURED",
            message: "Você ainda não configurou um PIN financeiro.",
        };
    }

    const isValid = await bcrypt.compare(pin as string, settings.pin_hash);
    if (isValid) {
        const { error: auditError } = await supabaseAdmin
            .from("user_financial_settings")
            .update({
                pin_last_verified_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);
        if (auditError) {
            console.warn("[financial-pin] PIN validated, but audit timestamp could not be stored:", auditError.message);
        }
    }

    return {
        isValid,
        code: isValid ? null : "INVALID_PIN",
        message: isValid ? null : "PIN incorreto. Confira os números e tente novamente.",
    };
}
