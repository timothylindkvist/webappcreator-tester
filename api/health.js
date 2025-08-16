export default async function handler(req, res){
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.status(200).send(JSON.stringify({
    ok: true,
    gateway: {
      url: "https://ai-gateway.vercel.sh/v1",
      apiKey: process.env.VERCEL_AI_GATEWAY_API_KEY ? "present" : "missing"
    },
    modelDefault: "openai/gpt-5"
  }));
}
