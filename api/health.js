export default async function handler(req, res){
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  const present = Boolean(process.env.OPENAI_API_KEY);
  res.status(200).send(JSON.stringify({
    ok: true,
    OPENAI_API_KEY: present ? "present" : "missing",
    OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-4o-mini"
  }));
}
