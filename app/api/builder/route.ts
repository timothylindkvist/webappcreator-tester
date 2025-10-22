import { log } from '@/lib/logger';
import { rateLimit } from '@/lib/ratelimit';
import { z } from 'zod';
import OpenAI from "openai";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: NextRequest) {
  const ip = (req.headers.get('x-forwarded-for') || 'anon').split(',')[0];
  const rl = rateLimit(`post:${ip}`, 30, 60);
  if (!rl.ok) return new Response(JSON.stringify({ error: 'rate_limited', reset: rl.reset }), { status: 429 });

  try {
    const body = await req.json();
    const site = body?.site || {};
    const brief = body?.brief || "";

    // If you have a real DB, persist `site` here.
    // For now, echo back the provided site and let the client store it.

    // Optionally ask GPT-5 to validate / refine (kept minimal per user's no-fallback requirement)
    const messages = [
      {
        role: "system",
        content:
          "You are Sidesmith's builder validator. Always respond in valid JSON: {\"reply\":\"...\", \"site\":{...}, \"events\":[]}",
      },
      {
        role: "user",
        content: `Validate or lightly refine this site JSON for the brief: "${brief}". Keep structure, return only JSON. SITE:\n${JSON.stringify(
          site
        )}`,
      },
    ] as const;

    const useAI = false; // keep disabled to avoid latency; flip to true if you want validation
    let siteOut = site;
    let reply = "Saved site";
    let events: any[] = [];

    if (useAI) {
      const completion = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL!,
        messages: messages as any,
        response_format: { type: "json_object" },
      });
      let parsed: any = {};
      try {
        parsed = JSON.parse(completion.choices?.[0]?.message?.content ?? "{}");
      } catch {
        return Response.json({ ok: false, error: "Invalid JSON from GPT-5" }, { status: 500 });
      }
      siteOut = parsed.site || site;
      reply = parsed.reply || reply;
      events = Array.isArray(parsed.events) ? parsed.events : [];
    }

    return Response.json({ ok: true, site: siteOut, reply, events });
  } catch (err: any) {
    console.error("builder route error", err);
    return Response.json({ ok: false, error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

// NOTE: Consider refactoring any OpenAI SDK calls above to the Responses API via fetch for Edge compatibility.
