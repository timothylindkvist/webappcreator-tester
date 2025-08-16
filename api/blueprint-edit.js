export const runtime = "nodejs";

import OpenAI from "openai";
import { MASTER_PROMPT } from "../masterPrompt.js";

function setStreamHeaders(res, version = "v8-edit") {
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
      setStreamHeaders(res);
      res.statusCode = 405;
      res.end("Blueprint Edit error (405): Method Not Allowed");
      return;
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const MODEL = (process.env.OPENAI_MODEL || "gpt-4o-mini").trim();

    if (!OPENAI_API_KEY) {
      setStreamHeaders(res);
      res.statusCode = 500;
      res.end("Blueprint Edit error (500): OPENAI_API_KEY missing");
      return;
    }

    const body = await readBody(req);
    const { blueprint, instruction } = body || {};
    if (!blueprint || !instruction) {
      setStreamHeaders(res);
      res.statusCode = 400;
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

    setStreamHeaders(res);
    res.setHeader("X-Model", MODEL);
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
    const msg =
      err?.response?.data?.error?.message ||
      err?.error?.message ||
      err?.message ||
      String(err);
    if (!res.headersSent) setStreamHeaders(res);
    res.statusCode = 500;
    res.end(`Blueprint Edit error (500): ${msg}`);
    console.error("[/api/blueprint-edit] Error:", err);
  }
}
