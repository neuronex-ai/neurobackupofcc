
import { ASAAS_API_KEY, ASAAS_BASE_URL } from "./supabase/functions/_shared/asaas-client.ts";

async function testRecovery() {
    const asaasAccountId = "54d2986d-549e-46ba-9ad1-6f96426a61f3";
    const url = `${ASAAS_BASE_URL}/accounts/${asaasAccountId}/apiKey`;
    
    console.log(`Testing recovery for ${asaasAccountId} at ${url}`);
    
    const res = await fetch(url, {
        method: "GET",
        headers: {
            "access_token": ASAAS_API_KEY
        }
    });
    
    const data = await res.json();
    console.log("Response:", JSON.stringify(data, null, 2));
}

testRecovery();
