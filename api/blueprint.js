// api/blueprint.js
export const runtime = "nodejs";

import { OpenAI } from "openai";
import { buildSystemPrompt } from "../masterPrompt.js";

function setStreamHeaders(res, version = "v7") {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("X-Accel-Buffering", "no");
  res.setHeader("X-Server-Version", version);
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const raw = await new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    setStreamHeaders(res);
    res.end("Blueprint error (405): Method Not Allowed");
    return;
  }

  const { OPENAI_API_KEY, OPENAI_MODEL } = process.env;
  const MODEL = OPENAI_MODEL || "gpt-4o-mini";
  if (!OPENAI_API_KEY) {
    res.statusCode = 500;
    setStreamHeaders(res);
    res.end("Blueprint error (500): OPENAI_API_KEY missing");
    return;
  }

  const body = await readBody(req);
  const { brief, styleReference, instruction } = body || {};
  const client = new OpenAI({ apiKey: OPENAI_API_KEY });

  const systemText = buildSystemPrompt({ styleReference, briefOrBlueprint: brief });
  const userText = `
Skip Step A (Clarify). Perform Step B only.
Return ONLY the raw Blueprint JSON.
Do NOT include markdown fences, prose, or any "FILE:" labels.
${instruction ? `\nADDITIONAL INSTRUCTION:\n${instruction}\n` : ""}
CLIENT BRIEF:
${brief || "Generate a sensible default business website blueprint with Home, Features, Pricing, and Contact pages. Tone: friendly. Primary CTA: Start free trial."}
`.trim();

  try {
    setStreamHeaders(res);
    res.flushHeaders?.();

    const stream = await client.chat.completions.create({
      model: MODEL,
      stream: true,
      temperature: 0.7,
      messages: [
        { role: "system", content: systemText },
        { role: "user", content: userText },
      ],
    });

    for await (const part of stream) {
      const delta = part?.choices?.[0]?.delta?.content || "";
      if (delta) res.write(delta);
    }
    res.end();
  } catch (err) {
    const msg = (err && err.message) ? err.message : String(err);
    if (!res.headersSent) setStreamHeaders(res);
    res.statusCode = 500;
    res.end(`Blueprint error (500): ${msg}`);
  }
}
