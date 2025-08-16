// api/blueprint.js
import OpenAI from "openai";
import { MASTER_PROMPT, buildSystemPrompt } from "../masterPrompt.js";

function setStreamHeaders(res, version = "v1") {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no");
  res.setHeader("X-Server-Version", version);
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const raw = await new Promise((resolve, reject) => {
    let data = "";
    req.on("data", c => (data += c));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.statusCode = 405;
      return res.end("Blueprint error (405): Method Not Allowed");
    }

    if (!process.env.OPENAI_API_KEY) {
      res.statusCode = 500;
      return res.end("Blueprint error (500): OPENAI_API_KEY missing");
    }

    const { brief, styleReference, instruction } = await readBody(req);
    const MODEL = (process.env.OPENAI_MODEL || "gpt-4o-mini").trim();

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const systemText = buildSystemPrompt({ styleReference, briefOrBlueprint: brief });
    const userText = `
Create a website BLUEPRINT as pure JSON only.
No prose, no code fences. If instructions are present, apply them.
${instruction ? `\nINSTRUCTIONS:\n${instruction}\n` : ""}
BRIEF:
${brief || "Simple SaaS: Home, Features, Pricing, Contact."}
`.trim();

    setStreamHeaders(res, "v1");
    res.setHeader("X-Model", MODEL);
    res.flushHeaders?.();

    const stream = await client.chat.completions.create({
      model: MODEL,
      stream: true,
      temperature: 0.4,
      messages: [
        { role: "system", content: systemText || MASTER_PROMPT },
        { role: "user", content: userText },
      ],
    });

    for await (const part of stream) {
      const delta = part?.choices?.[0]?.delta?.content || "";
      if (delta) res.write(delta);
    }
    res.end();
  } catch (err) {
    const msg = err?.response?.data?.error?.message || err?.message || String(err);
    if (!res.headersSent) setStreamHeaders(res, "v1");
    res.statusCode = 500;
    res.end(`Blueprint error (500): ${msg}`);
  }
}
