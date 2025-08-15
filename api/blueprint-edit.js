// api/blueprint-edit.js
// OPTIONAL: prototype for incremental edits — not wired into the UI by default.
export const runtime = "nodejs";

import { OpenAI } from "openai";
import { MASTER_PROMPT } from "../masterPrompt.js";

function setStreamHeaders(res, version = "v6-edit") {
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
    res.end("Blueprint Edit error (405): Method Not Allowed");
    return;
  }

  const { OPENAI_API_KEY, OPENAI_MODEL } = process.env;
  const MODEL = OPENAI_MODEL || "gpt-4o-mini";
  if (!OPENAI_API_KEY) {
    res.statusCode = 500;
    setStreamHeaders(res);
    res.end("Blueprint Edit error (500): OPENAI_API_KEY missing");
    return;
  }

  const body = await readBody(req);
  const { blueprint, instruction } = body || {};
  if (!blueprint || !instruction) {
    res.statusCode = 400;
    setStreamHeaders(res);
    res.end("Blueprint Edit error (400): 'blueprint' and 'instruction' are required");
    return;
  }

  const bpText = typeof blueprint === "string" ? blueprint : JSON.stringify(blueprint);
  const userText = `
You will minimally edit the existing site blueprint JSON according to the instruction.

Return ONLY the updated Blueprint JSON object.
Do NOT include markdown fences, diff syntax, comments, or prose.
Preserve structure and fields that are not directly relevant to the edit.

INSTRUCTION:
${instruction}

CURRENT BLUEPRINT JSON:
${bpText}
`.trim();

  try {
    setStreamHeaders(res);
    res.flushHeaders?.();

    const client = new OpenAI({ apiKey: OPENAI_API_KEY });
    const stream = await client.chat.completions.create({
      model: MODEL,
      stream: true,
      temperature: 0.2,
      messages: [
        { role: "system", content: MASTER_PROMPT },
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
    res.end(`Blueprint Edit error (500): ${msg}`);
  }
}
