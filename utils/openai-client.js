const BASE_URL = (process.env.AI_GATEWAY_URL || 'https://ai-gateway.vercel.sh/v1').replace(/\/$/, '');
const API_KEY = process.env.VERCEL_AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY;

if (!API_KEY) {
  console.warn("[AI Gateway] Missing API key. Set VERCEL_AI_GATEWAY_API_KEY (preferred) or OPENAI_API_KEY.");
}

export async function streamChat({ apiKey = API_KEY, model, messages, response_format }) {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      // Use GPT‑5 family on the AI Gateway by default. You may override with OPENAI_MODEL.
      model: model || process.env.OPENAI_MODEL || "openai/gpt-5",
      messages,
      stream: true,
      response_format
    })
  });
  if (!res.ok) throw new Error(`AI Gateway error (${res.status}): ${await res.text()}`);
  return res;
}
