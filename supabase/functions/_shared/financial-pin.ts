import * as bcrypt from "https://esm.sh/bcryptjs@2.4.3";

import { supabaseAdmin } from "./asaas-client.ts";

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
        await supabaseAdmin
            .from("user_financial_settings")
            .update({
                pin_last_verified_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);
    }

    return {
        isValid,
        code: isValid ? null : "INVALID_PIN",
        message: isValid ? null : "PIN incorreto. Confira os números e tente novamente.",
    };
}
