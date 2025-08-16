// Server-only helper (do NOT import in client bundles)
const BASE_URL = "https://ai-gateway.vercel.sh/v1";         // Vercel AI Gateway (OpenAI-compatible)
const API_KEY = process.env.VERCEL_AI_GATEWAY_API_KEY;       // single required env (already set in Vercel)

if (!API_KEY) {
  console.warn("[AI Gateway] Missing API key. Set VERCEL_AI_GATEWAY_API_KEY in your Vercel project.");
}

export async function streamChat({
  messages,
  response_format,
  model = "openai/gpt-5",   // default to GPT-5; can be overridden per call if needed
  apiKey = API_KEY,
}) {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      response_format,
    }),
  });
  if (!res.ok) throw new Error(`AI Gateway error (${res.status}): ${await res.text()}`);
  return res;
}
