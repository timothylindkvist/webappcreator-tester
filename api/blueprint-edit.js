// api/blueprint-edit.js
import OpenAI from "openai";
import { MASTER_PROMPT, buildSystemPrompt } from "../masterPrompt.js";

function setStreamHeaders(res, version = "v1-edit") {
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
      return res.end("Method Not Allowed");
    }
    if (!process.env.OPENAI_API_KEY) {
      res.statusCode = 500;
      return res.end("Missing OPENAI_API_KEY");
    }

    const { blueprint, brief, instructions, styleReference } = await readBody(req);
    const MODEL = (process.env.OPENAI_MODEL || "gpt-4o-mini").trim();
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemText = buildSystemPrompt({
      styleReference,
      briefOrBlueprint: blueprint || brief
    });

    const messages = [
      { role: "system", content: systemText || MASTER_PROMPT },
      {
        role: "user",
        content:
`Edit this website blueprint according to the instructions.
Return ONLY the updated blueprint JSON. No prose.

Original blueprint:
${JSON.stringify(blueprint || {}, null, 2)}

${brief ? `Client brief:\n${brief}\n` : ""}
${instructions ? `Edit instructions:\n${instructions}\n` : ""}`
      }
    ];

    setStreamHeaders(res, "v1-edit");
    res.setHeader("X-Model", MODEL);
    res.flushHeaders?.();

    const stream = await client.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.2,
      stream: true
    });

    for await (const chunk of stream) {
      const delta =
        chunk?.choices?.[0]?.delta?.content ||
        chunk?.choices?.[0]?.delta?.text || "";
      if (delta) res.write(delta);
    }
    res.end();
  } catch (err) {
    const msg = err?.response?.data?.error?.message || err?.message || String(err);
    if (!res.headersSent) setStreamHeaders(res, "v1-edit");
    res.statusCode = 500;
    res.end(`Blueprint Edit error (500): ${msg}`);
  }
}
