import { log } from '@/lib/logger';
import { rateLimit } from '@/lib/ratelimit';
import { z } from 'zod';
import OpenAI from "openai";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
  const ip = (req.headers.get('x-forwarded-for') || 'anon').split(',')[0];
  const rl = rateLimit(`post:${ip}`, 30, 60);
  if (!rl.ok) return new Response(JSON.stringify({ error: 'rate_limited', reset: rl.reset }), { status: 429 });

  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { ok: false, error: "Missing OPENAI_API_KEY" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string") {
      return Response.json(
        { ok: false, error: "Missing or invalid prompt" },
        { status: 400 }
      );
    }

    const result = await client.images.generate({
      model: "gpt-image-1",
      prompt: prompt,
      size: "1024x1024",
    });

    const imageUrl =
      result.data?.[0]?.url ||
      (result.data?.[0]?.b64_json
        ? `data:image/png;base64,${result.data[0].b64_json}`
        : null);

    if (!imageUrl) {
      return Response.json(
        { ok: false, error: "No image URL returned" },
        { status: 502 }
      );
    }

    return Response.json({ ok: true, url: imageUrl });
  } catch (err: any) {
    console.error("test-gpt5 route error", err);
    return Response.json(
      { ok: false, error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

// NOTE: Consider refactoring any OpenAI SDK calls above to the Responses API via fetch for Edge compatibility.
