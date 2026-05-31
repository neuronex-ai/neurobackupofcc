const token = Deno.env.get("SUPABASE_ANON_KEY"); // I need a valid token.
// Let's just use the internal secret!
const url = "https://krewdaklcyzqfxkkgvqr.supabase.co/functions/v1/gemini-text-chat";

async function test() {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-synapse-secret": process.env.SYNAPSE_INTERNAL_SECRET || "internal_secret_here"
    },
    body: JSON.stringify({ message: "Oi", professional_id: "some-uuid" })
  });
  
  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", text);
}

test();
