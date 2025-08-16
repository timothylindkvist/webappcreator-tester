// api/blueprint-edit.js
import OpenAI from "openai";
import { MASTER_PROMPT } from "../masterPrompt.js";
export const runtime = "nodejs";

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
      res.statusCode = 405;
      return res.end("Method Not Allowed");
    }

    const { blueprint, brief, instructions } = await readBody(req);
    if (!process.env.OPENAI_API_KEY) {
      res.statusCode = 500;
      return res.end("Missing OPENAI_API_KEY");
    }

    setStreamHeaders(res);
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Minimal “edit” prompt – preserve your contract
    const messages = [
      { role: "system", content: MASTER_PROMPT },
      {
        role: "user",
        content:
          `You are editing an existing website blueprint.\n\n` +
          `Original blueprint (JSON):\n${JSON.stringify(blueprint || {}, null, 2)}\n\n` +
          (brief ? `Client brief:\n${brief}\n\n` : "") +
          (instructions ? `Edit instructions:\n${instructions}\n\n` : "") +
          `Return ONLY the updated blueprint JSON.`
      }
    ];

    const stream = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages,
      temperature: 0.2,
      stream: true
    });

    for await (const chunk of stream) {
      const delta =
        chunk?.choices?.[0]?.delta?.content ||
        chunk?.choices?.[0]?.delta?.text ||
        "";
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
