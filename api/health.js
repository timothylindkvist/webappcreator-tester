export default async function handler(req, res){
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  const gatewayUrl = (process.env.AI_GATEWAY_URL || "https://ai-gateway.vercel.sh/v1");
  const keyPref = Boolean(process.env.VERCEL_AI_GATEWAY_API_KEY);
  const keyOpenAI = Boolean(process.env.OPENAI_API_KEY);
  const model = process.env.OPENAI_MODEL || "openai/gpt-5";
  res.status(200).send(JSON.stringify({
    ok: true,
    gateway: {
      url: gatewayUrl,
      apiKey: keyPref ? "VERCEL_AI_GATEWAY_API_KEY" : (keyOpenAI ? "OPENAI_API_KEY" : "missing")
    },
    OPENAI_MODEL: model
  }));
}
