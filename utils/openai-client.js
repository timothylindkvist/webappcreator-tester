export async function streamChat({ apiKey, model, messages, response_format }) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model || process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages,
      stream: true,
      response_format
    })
  });
  if (!res.ok) throw new Error(`OpenAI error: ${await res.text()}`);
  return res;
}
