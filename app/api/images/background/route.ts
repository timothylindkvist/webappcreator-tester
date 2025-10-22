const BG_CACHE: Map<string, any> = (globalThis as any).__bg_cache__ || new Map(); (globalThis as any).__bg_cache__ = BG_CACHE;
import { sha256String } from '@/lib/hash';
import { log } from '@/lib/logger';
import { rateLimit } from '@/lib/ratelimit';
import { z } from 'zod';
import OpenAI from "openai";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

function isDescriptive(brief: string) {
  if (!brief) return false;
  const keywords = ["photo","ocean","reef","diver","coffee","gym","yoga","studio","restaurant","cafe","shop","ecommerce","mountain","forest","city","skyline","tech","circuit","saas","startup","fitness","nature","abstract","pattern","texture","background","hero","banner","illustration","3d","render","painting","architecture","interior","underwater","space","galaxy","stars"];
  const b = brief.toLowerCase();
  return keywords.some(k => b.includes(k));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const key = await sha256String(JSON.stringify(body));
  if (BG_CACHE.has(key)) return new Response(JSON.stringify(BG_CACHE.get(key)), { status: 200 });
  // original body continues
  const _req_reset = body;
  const ip = (req.headers.get('x-forwarded-for') || 'anon').split(',')[0];
  const rl = rateLimit(`post:${ip}`, 30, 60);
  if (!rl.ok) return new Response(JSON.stringify({ error: 'rate_limited', reset: rl.reset }), { status: 429 });

  try {
    const body = await req.json();
    const brief: string = body?.brief || "";
    const palette: string[] = Array.isArray(body?.palette) ? body.palette : [];

    if (!process.env.OPENAI_API_KEY) {
      return Response.json({ ok: false, error: "Missing OPENAI_API_KEY" }, { status: 401 });
    }

    if (!isDescriptive(brief)) {
      const brand = palette?.[0] || "#7C3AED";
      const accent = palette?.[1] || "#06B6D4";
      return Response.json({ ok: true, gradient: { from: brand, to: accent } });
    }

    const prompt = `modern landing-page style background related to: ${brief}. Soft lighting, subtle depth, minimal UI layout cues, glassmorphism vibe, no readable text, wide composition, works behind UI.`;

    const image = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      size: "1792x1024",
      quality: "standard",
    });

    const url = image?.data?.[0]?.url;
    if (!url) return Response.json({ ok: false, error: "No image URL returned" }, { status: 502 });
    return Response.json({ ok: true, url });
  } catch (err: any) {
    console.error("images/background error", err);
    return Response.json({ ok: false, error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

// NOTE: Consider refactoring any OpenAI SDK calls above to the Responses API via fetch for Edge compatibility.