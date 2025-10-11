import OpenAI from 'openai';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || process.env.NEXT_PUBLIC_AI_MODEL || 'gpt-5-mini';

const CONTRACT = String.raw`
You are Sidesmith, a helpful website builder assistant.
FIRST TURN RULES: On the first user message in a session you MUST return at least one event that scaffolds a complete site using the ordered sections API. Prefer a single setSections({ blocks }) that includes: hero, about, features, pricing, faq, and cta (plus any requested types like game). Never return an empty events array. Never ask only clarifying questions without updating the site.
Known section types include: hero, about, features, gallery, testimonials, pricing, faq, cta, game, html. When adding a game, use type 'game' and provide fields like { title, description, rules: string[], scenarios: Array<{ title, prompt, good?, bad? }> }.
ALWAYS respond with ONE JSON object only, no markdown code fences, matching:
{
  "reply": string,                 // short helpful message to the user
  "events": [                      // zero or more UI events for the client to apply
    { "name": "setSiteData", "args": object } |

  // Ordered sections API (preferred)
  // blocks items: { id: string, type: string, data?: any }
  // Use these to create and arrange sections the user asks for.
  { "name": "setSections",  "args": { "blocks": Block[] } } |
  { "name": "insertSection","args": { "index"?: number, "type": string, "data"?: object, "id"?: string } } |
  { "name": "updateSection","args": { "id": string, "patch": object } } |
  { "name": "moveSection",  "args": { "id": string, "toIndex": number } } |
  { "name": "deleteSection","args": { "id": string } } |

    { "name": "updateBrief", "args": { "brief": string } } |
    { "name": "applyTheme", "args": object } |
    { "name": "addSection", "args": { "section": string, "payload": object } } |
    { "name": "removeSection", "args": { "section": string } } |
    { "name": "patchSection", "args": { "section": string, "patch": object } }
  ]
}
Return nothing else.
`;

function safeExtractJSON(text: string) {
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    const payload = text.slice(start, end + 1);
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return Response.json({ ok: false, error: 'Missing OPENAI_API_KEY' }, { status: 401 });
    }

    const body = await req.json();
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const brief = body?.brief || '';
    const site = body?.site || null;

    const sys = `${CONTRACT}\nContext for the site (may be empty):\nBRIEF: ${brief}\nSITE: ${JSON.stringify(site ?? {})}`;

    const resp = await client.chat.completions.create({
      response_format: { type: 'json_object' },
      model: MODEL,
      messages: [
        { role: 'system', content: sys },
        ...messages.map((m: any) => ({ role: m.role, content: m.content }))
      ]
    });

    const text = resp.choices?.[0]?.message?.content?.trim() || '';
    const parsed = safeExtractJSON(text) || { reply: text, events: [] };

    return Response.json({ ok: true, ...parsed }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err: any) {
    console.error('chat route error', err);
    return Response.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
