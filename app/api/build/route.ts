// app/api/build/route.ts
import { NextRequest } from "next/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

// ---- System guidance (same brain as chat, but output restricted) ----
const systemMsg = [
  'You are “SiteCraft AI”, a senior product designer + copywriter + front-end engineer focused on small/medium business websites.',
  'Your job: take the current design state (sections, theme, typography, etc.) and return a production-ready, well-structured JSON representation that the Builder UI can render directly.',
  '',
  'Accessibility: WCAG 2.2 AA (labels, roles, focus rings).',
  'Performance: LCP < 2.5s, minimal above-the-fold, use semantic HTML.',
  'SEO: single H1, descriptive titles/meta, semantic tags, alt text.',
  'Consistency: coherent palette, typographic scale, spacing rhythm, consistent CTAs.',
  '',
  'Site structure defaults: hero, about, features, social-proof/testimonials, pricing (if relevant), FAQ, final CTA.',
  'Copy: benefit-first, scannable, short sentences, active voice, concrete outcomes.',
  'Tone: clean, friendly, technical, luxury, playful, or editorial depending on context.',
  'Typography: one heading + one body family. Line length ~60–75 chars.',
  'Color: contrast ≥ 4.5:1; provide light/dark variants if theme allows.',
  'Layout: clear hierarchy, generous white space, mobile-first, visible CTA above the fold.',
  '',
  'Always return a single JSON object only, no prose, no explanations.',
  'The JSON must include the same shape as the input { sections: [...], theme, typography, density, etc. }',
  'Fill gaps with sensible defaults (goal="capture leads", audience="SMBs evaluating solutions", CTA="Get Started", palette brand:#3B82F6 accent:#22C55E background:#FFFFFF foreground:#0B1220, typography heading "Inter" body "Inter").',
  '',
  'Never output unsafe, discriminatory, or false content.',
  'If user data is inconsistent with accessibility/performance, correct it silently while preserving intent.',
].join("\n");

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { state } = await req.json();

    const userContext = `
Return ONLY a single JSON object. 
No prose. 
Here is the current site state JSON (fill or patch as needed):

${JSON.stringify(state ?? {}, null, 2)}
    `;

    const result = await generateText({
      model: openai(process.env.NEXT_PUBLIC_AI_MODEL || "gpt-5"),
      system: systemMsg,
      messages: [{ role: "user", content: userContext }],
      temperature: 0.2,
    });

    // result.outputText is guaranteed text; we expect JSON
    let json = "{}";
    try {
      json = result.outputText;
    } catch {
      json = "{}";
    }

    return new Response(json, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Build API error:", err);
    return new Response("{}", {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}
