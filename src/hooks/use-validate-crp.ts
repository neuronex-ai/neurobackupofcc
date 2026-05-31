import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CRPValidationResult {
    valid: boolean;
    crp?: string;
    state_code?: string;
    state_name?: string;
    registration_number?: string;
    verified_online?: boolean;
    professional_name?: string;
    situation?: string;
    is_active?: boolean;
    registration_date?: string;
    regional?: string;
    found?: boolean;
    total_results?: number;
    cfp_results?: Array<{
        nome: string | null;
        registro: string | null;
        situacao: string | null;
        data_inscricao: string | null;
        nome_regional: string | null;
    }>;
    error?: string;
    format_error?: boolean;
    state_code_error?: boolean;
    api_error?: string;
    api_error_detail?: string;
    message?: string;
}

interface ValidateCRPParams {
    crp: string;
    validateOnline?: boolean;
}

/**
 * Hook to validate CRP (Regional Psychology Council) registration numbers.
 * 
 * Performs:
 * 1. Format validation (XX/XXXXX)
 * 2. State code validation (01-27)
 * 3. Optional online validation against CFP national registry
 * 
 * @example
 * ```tsx
 * const { mutate: validateCRP, isPending } = useValidateCRP();
 * 
 * validateCRP({ crp: "06/12345" }, {
 *   onSuccess: (result) => {
 *     if (result.valid) {
 *       console.log("Valid CRP from", result.state_name);
 *     }
 *   }
 * });
 * ```
 */
export const useValidateCRP = () => {
    return useMutation({
        mutationFn: async ({ crp, validateOnline = false }: ValidateCRPParams): Promise<CRPValidationResult> => {
            const { data, error } = await supabase.functions.invoke('validate-crp', {
                body: { crp, validateOnline }
            });

            if (error) {
                console.error('[useValidateCRP] Supabase function error:', error);
                // Try to extract error message
                throw new Error(error.message || 'Erro ao validar CRP');
            }

            return data as CRPValidationResult;
        },
        onSuccess: (data) => {
            if (data.valid) {
                if (data.verified_online && data.is_active) {
                    toast.success(`CRP verificado! Profissional ativo em ${data.state_name}`);
                } else if (data.verified_online && !data.is_active) {
                    toast.warning(`CRP encontrado, mas situação: ${data.situation}`);
                } else {
                    toast.success(`Formato de CRP válido (${data.state_name})`);
                }
            } else {
                toast.error(data.error || 'CRP inválido');
            }
        },
        onError: (error: Error) => {
            toast.error(`Erro na validação: ${error.message}`);
        }
    });
};

/**
 * Synchronous CRP format validation (no API call)
 * Use this for real-time input validation
 */
export function isValidCRPFormat(crp: string): boolean {
    const normalizedCRP = crp.trim().toUpperCase().replace(/\s+/g, "");
    const crpRegex = /^(\d{2})\/(\d{4,6})$/;
    const match = normalizedCRP.match(crpRegex);

    if (!match) return false;

    const stateCode = parseInt(match[1], 10);
    return stateCode >= 1 && stateCode <= 27;
}

/**
 * Format CRP as user types
 * @param value - Raw input value
 * @returns Formatted CRP string
 */
export function formatCRP(value: string): string {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length > 2) {
        return numbers.slice(0, 2) + "/" + numbers.slice(2, 7);
    }
    return numbers;
}

/**
 * CRP state codes mapping
 */
export const CRP_STATES: Record<string, string> = {
    "01": "Distrito Federal",
    "02": "Pernambuco",
    "03": "Bahia",
    "04": "Minas Gerais",
    "05": "Rio de Janeiro",
    "06": "São Paulo",
    "07": "Rio Grande do Sul",
    "08": "Paraná",
    "09": "Goiás/Tocantins",
    "10": "Pará/Amapá",
    "11": "Ceará",
    "12": "Santa Catarina",
    "13": "Paraíba",
    "14": "Mato Grosso do Sul",
    "15": "Alagoas",
    "16": "Espírito Santo",
    "17": "Rio Grande do Norte",
    "18": "Mato Grosso",
    "19": "Sergipe",
    "20": "Amazonas/Roraima/Acre/Rondônia",
    "21": "Piauí",
    "22": "Maranhão",
    "23": "Tocantins",
    "24": "Aracaju",
    "25": "Fortaleza",
    "26": "Brasília",
    "27": "Curitiba"
};

/**
 * Get state name from CRP
 */
export function getStateFromCRP(crp: string): string | null {
    const match = crp.match(/^(\d{2})\//);
    if (match && CRP_STATES[match[1]]) {
        return CRP_STATES[match[1]];
    }
    return null;
}
