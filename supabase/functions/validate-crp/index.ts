
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Validates a CRP (Regional Psychology Council) registration number
 * against the CFP national registry via Infosimples API.
 */

// Map CRP regional codes to UF (State Abbreviation) for Infosimples API
const CRP_TO_UF: Record<string, string> = {
    "01": "DF", "02": "PE", "03": "BA", "04": "MG", "05": "RJ", "06": "SP",
    "07": "RS", "08": "PR", "09": "GO", "10": "PA", "11": "CE", "12": "SC",
    "13": "PB", "14": "MS", "15": "AL", "16": "ES", "17": "RN", "18": "MT",
    "19": "SE", "20": "AM", "21": "PI", "22": "MA", "23": "TO", "24": "RO",
    "25": "AC", "26": "AP", "27": "RR",
};

// Map CRP regional codes to full regional names
const CRP_TO_REGIONAL_NAME: Record<string, string> = {
    "01": "CRP-01 (DF/AC/MT)", "02": "CRP-02 (PE)", "03": "CRP-03 (BA/SE)",
    "04": "CRP-04 (MG)", "05": "CRP-05 (RJ/ES)", "06": "CRP-06 (SP)",
    "07": "CRP-07 (RS)", "08": "CRP-08 (PR)", "09": "CRP-09 (GO/TO)",
    "10": "CRP-10 (PA/AP)", "11": "CRP-11 (CE/PI/MA)", "12": "CRP-12 (SC)",
    "13": "CRP-13 (PB)", "14": "CRP-14 (MS)", "15": "CRP-15 (AL)",
    "16": "CRP-16 (ES)", "17": "CRP-17 (RN)", "18": "CRP-18 (MT)",
    "19": "CRP-19 (SE)", "20": "CRP-20 (AM/RR/AC/RO)", "21": "CRP-21 (PI)",
    "22": "CRP-22 (MA)", "23": "CRP-23 (TO)", "24": "CRP-24 (AP)",
};

/**
 * Build search query strategies ordered by effectiveness.
 */
function buildSearchStrategies(
    uf: string | undefined,
    registrationPart: string,
    normalizedCRP: string,
    nome?: string,
    cpf?: string,
): Array<{ label: string; params: Record<string, string> }> {
    const strategies: Array<{ label: string; params: Record<string, string> }> = [];
    const regNoLeadingZeros = registrationPart.replace(/^0+/, "");
    const hasLeadingZeros = regNoLeadingZeros !== registrationPart;

    // IMPORTANT: The Infosimples API does NOT accept registration numbers with leading zeros.
    // E.g. "04474" will NOT return results, but "4474" WILL.
    // So we ALWAYS try without leading zeros FIRST.

    if (uf) {
        // Strategy 1 (BEST & FASTEST): UF + Registration WITHOUT leading zeros
        strategies.push({
            label: `UF(${uf}) + Registro sem zeros(${regNoLeadingZeros})`,
            params: { uf, registro: regNoLeadingZeros },
        });

        // Strategy 2: UF + Exact Registration (with leading zeros, as fallback)
        if (hasLeadingZeros) {
            strategies.push({
                label: `UF(${uf}) + Registro original(${registrationPart})`,
                params: { uf, registro: registrationPart },
            });
        }
    } else {
        // Fallback if UF is unknown (should not happen for valid CRPs)
        strategies.push({
            label: `Registro sem zeros(${regNoLeadingZeros})`,
            params: { registro: regNoLeadingZeros },
        });
    }

    // Strategy 3: Just registration number without leading zeros (no UF filter)
    strategies.push({
        label: `Somente registro sem zeros(${regNoLeadingZeros})`,
        params: { registro: regNoLeadingZeros },
    });

    return strategies;
}

/**
 * Call the Infosimples API with given parameters.
 */
async function queryInfosimples(
    token: string,
    searchParams: Record<string, string>,
): Promise<{ success: boolean; data?: any; error?: string }> {
    const params = new URLSearchParams({
        token,
        timeout: "15", // Reduced timeout to fail faster (15s)
    });

    for (const [key, value] of Object.entries(searchParams)) {
        params.append(key, value);
    }

    const apiUrl = `https://api.infosimples.com/api/v2/consultas/cfp/cadastro?${params.toString()}`;

    try {
        const response = await fetch(apiUrl, {
            method: "GET",
            headers: { "Accept": "application/json" },
        });

        if (!response.ok) {
            return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
        }

        const apiData = await response.json();

        if (apiData.code === 200 && apiData.data && apiData.data.length > 0) {
            return { success: true, data: apiData };
        } else if (apiData.code === 600) {
            return { success: false, error: "Consulta expirou (Timeout)." };
        } else if (apiData.code === 200 && (!apiData.data || apiData.data.length === 0)) {
            return { success: false, error: "Nenhum resultado." };
        } else {
            return { success: false, error: apiData.code_message || ("Erro API: " + apiData.code) };
        }
    } catch (err: any) {
        return { success: false, error: err.message || "Erro conexao" };
    }
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const body = await req.json();
        const { crp, nome, cpf, validateOnline = true } = body;

        if (!crp || typeof crp !== "string") {
            return new Response(
                JSON.stringify({ valid: false, error: "CRP e obrigatorio" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const normalizedCRP = crp.trim().toUpperCase().replace(/\s+/g, "");
        const crpRegex = /^(\d{2})\/(\d{4,6})$/;
        const match = normalizedCRP.match(crpRegex);

        if (!match) {
            return new Response(
                JSON.stringify({ valid: false, error: "Formato invalido", format_error: true }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const [, stateCode, registrationNumber] = match;
        const uf = CRP_TO_UF[stateCode];

        const result: any = {
            valid: true,
            crp: normalizedCRP,
            state_code: stateCode,
            state_name: CRP_TO_REGIONAL_NAME[stateCode] || "Desconhecido",
            registration_number: registrationNumber,
            verified_online: false,
            found: false,
            cfp_results: [],
        };

        if (validateOnline) {
            const INFOSIMPLES_TOKEN = Deno.env.get("INFOSIMPLES_API_TOKEN");

            if (!INFOSIMPLES_TOKEN) {
                result.api_error = "Token nao configurado.";
                return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
            }

            const strategies = buildSearchStrategies(uf, registrationNumber, normalizedCRP, nome, cpf);
            console.log(`[validate-crp] CRP: ${normalizedCRP} Strategies: ${strategies.length}`);

            let foundData: any = null;
            let lastError: string | null = null;
            const attemptCount = strategies.length;

            // Parallel execution: Run all strategies and take the first successful one
            const promises = strategies.map(async (strategy) => {
                console.log(`[validate-crp] Starting strategy: ${strategy.label}`);
                const result = await queryInfosimples(INFOSIMPLES_TOKEN, strategy.params);
                return { ...result, strategyLabel: strategy.label };
            });

            try {
                // Wait for the first SUCCESS (not just first completion)
                foundData = await new Promise((resolve) => {
                    let completed = 0;
                    let resolved = false;

                    if (promises.length === 0) resolve(null);

                    promises.forEach(p => {
                        p.then(res => {
                            if (resolved) return;

                            if (res.success && res.data) {
                                resolved = true;
                                console.log(`[validate-crp] FAST WINNER: ${res.strategyLabel}`);
                                resolve(res.data);
                            } else {
                                completed++;
                                if (res.error) lastError = res.error;
                                if (completed === promises.length) {
                                    resolve(null); // All failed
                                }
                            }
                        }).catch(err => {
                            completed++;
                            if (completed === promises.length && !resolved) resolve(null);
                        });
                    });
                });
            } catch (e) {
                console.error("Parallel execution error:", e);
            }

            if (foundData) {
                const winningStrategy = strategies.find(s => JSON.stringify(s.params) === JSON.stringify(foundData?.params)); // Approximation
                // We actually don't easily know which strategy won in the formatting block below without passing it through, 
                // but we logged it above.
            }

            if (foundData) {
                result.verified_online = true;
                result.found = true;

                // The Infosimples API wraps results in different structures:
                // - Sometimes: data = [{"resultados": [{nome, registro, ...}], "site_receipt": "..."}]
                // - Sometimes: data = [{nome, registro, ...}]
                // We need to handle both cases robustly.
                const rawDataArray = foundData.data || [];

                // Flatten: unwrap any nested "resultados" arrays
                const flattenedResults: any[] = [];
                for (const item of rawDataArray) {
                    if (item.resultados && Array.isArray(item.resultados)) {
                        // Unwrap nested resultados array
                        console.log(`[validate-crp] Unwrapping nested 'resultados' with ${item.resultados.length} items`);
                        flattenedResults.push(...item.resultados);
                    } else if (item.nome || item.registro || item.situacao) {
                        // Direct item with professional fields
                        flattenedResults.push(item);
                    } else {
                        console.log("[validate-crp] Skipping unrecognized item:", JSON.stringify(item).substring(0, 200));
                    }
                }

                console.log(`[validate-crp] Flattened results count: ${flattenedResults.length}`);

                result.cfp_results = flattenedResults.map((item: any) => {
                    // Robust name extraction from flattened item
                    const extractedName = item.nome || item.razao_social || item.nome_completo || item.name || null;

                    if (!extractedName) {
                        console.log("[validate-crp] Warning: Name missing in flattened item:", JSON.stringify(item).substring(0, 300));
                    } else {
                        console.log(`[validate-crp] Extracted name: ${extractedName}`);
                    }

                    return {
                        nome: extractedName,
                        registro: item.registro || null,
                        situacao: item.situacao || null,
                        data_inscricao: item.data_inscricao || null,
                        nome_regional: item.nome_regional || null,
                    };
                });

                const primary = result.cfp_results[0];
                if (primary) {
                    result.professional_name = primary.nome;
                    result.situation = primary.situacao;
                    const sitLower = (primary.situacao || "").toLowerCase();
                    result.is_active = sitLower.includes("ativ") || sitLower.includes("regular") || sitLower.includes("adimplente");
                    result.registration_date = primary.data_inscricao;
                    result.regional = primary.nome_regional;
                }

                result.total_results = result.cfp_results.length;
                result.search_strategy_used = attemptCount;
            } else {
                result.verified_online = true;
                result.found = false;
                result.attempts = attemptCount;
                if (lastError) result.api_error_detail = lastError;
            }
        }

        return new Response(
            JSON.stringify(result),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error: any) {
        console.error("[validate-crp] Fatal Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
});
