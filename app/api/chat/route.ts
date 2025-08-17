export const runtime = "edge";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// -- NDJSON helper
function sendJSON(controller: ReadableStreamDefaultController<Uint8Array>, obj: any) {
  const enc = new TextEncoder();
  controller.enqueue(enc.encode(JSON.stringify(obj) + "\n"));
}

// --- Simple heuristics to produce a polished default when prompts are weak ---
function inferName(messages: any[]) {
  const t = (messages.at(-1)?.content || "").toLowerCase();
  if (t.includes("scuba") || t.includes("dive")) return "Blue Current Diving";
  if (t.includes("coffee")) return "Roast & Ritual";
  if (t.includes("car")) return "DriveWorks";
  return "Bright Studio";
}
function inferHeroTitle(messages: any[]) {
  const t = messages.at(-1)?.content?.trim();
  if (!t || t.length < 6) return "Let’s build your website";
  return t.length > 70 ? t.slice(0, 70) + "…" : t;
}
function inferPaletteFrom(messages: any[]) {
  const txt = (messages.at(-1)?.content || "").toLowerCase();
  if (txt.includes("scuba") || txt.includes("ocean"))
    return { brand: "#0EA5A4", accent: "#F59E0B", background: "#FFFFFF", foreground: "#0B0F19" };
  if (txt.includes("coffee"))
    return { brand: "#6B4423", accent: "#D97706", background: "#FFFBF7", foreground: "#1F2937" };
  if (txt.includes("car"))
    return { brand: "#111827", accent: "#2563EB", background: "#FFFFFF", foreground: "#0B0F19" };
  return { brand: "#7C3AED", accent: "#06B6D4", background: "#FFFFFF", foreground: "#0B0F19" };
}
function normalizeSite(site: any) {
  site.theme = site.theme || {};
  site.theme.palette = {
    brand: site.theme.palette?.brand || "#7C3AED",
    accent: site.theme.palette?.accent || "#06B6D4",
    background: site.theme.palette?.background || "#FFFFFF",
    foreground: site.theme.palette?.foreground || "#0B0F19",
  };
  site.brand = site.brand || { name: "Your Brand", tagline: "We make it easy." };
  site.hero = site.hero || { title: "Let’s build your website", subtitle: "Polished and fast.", cta: { label: "Get started", href: "#" } };
  site.features = site.features || { title: "Why choose us", items: [] };
  site.gallery = site.gallery || { title: "Featured work", images: [] };
  site.testimonials = site.testimonials || { title: "What customers say", items: [] };
  return site;
}

export async function POST(req: NextRequest) {
  const { messages = [], state } = await req.json();

  const systemMsg = {
    role: "system" as const,
    content: [
      "You are a senior product designer + copywriter for SMB websites.",
      "RULES:",
      "1) Always ask up to 3 SHORT clarifying questions (bulleted).",
      "2) BUT DO NOT BLOCK. Proceed immediately with a polished draft using tasteful assumptions.",
      "3) Use benefit-led copy, scannable bullets, strong hero, 4–6 sections minimum.",
      "4) Always pick a coherent palette, typography, CTAs, and relevant imagery placeholders.",
      "5) When building or editing, CALL TOOLS to actually apply changes (setSiteData for full draft; setTheme/addSection/patchSection/etc for edits).",
      "6) If user is very detailed, obey them exactly. If vague, make bold but reasonable assumptions."
    ].join(" ")
  };

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // Keep-alive ping to avoid edge timeouts
      const ping = setInterval(() => {
        try { controller.enqueue(new TextEncoder().encode(":ping\n")); } catch { clearInterval(ping); }
      }, 15000);

      let toolCalled = false;

      try {
        const response = await client.chat.completions.create({
          model: process.env.NEXT_PUBLIC_AI_MODEL || "gpt-4o-mini",
          stream: true,
          messages: [systemMsg, ...messages],
          tools: [
            {
              type: "function",
              function: {
                name: "setSiteData",
                description: "Replace the entire site with a complete, polished website.",
                parameters: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    theme: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        vibe: { type: "string" },
                        palette: {
                          type: "object",
                          additionalProperties: false,
                          properties: {
                            brand: { type: "string" },
                            accent: { type: "string" },
                            background: { type: "string" },
                            foreground: { type: "string" }
                          },
                          required: ["brand","accent","background","foreground"]
                        },
                        typography: {
                          type: "object",
                          additionalProperties: true,
                          properties: {
                            body: { type: "string" },
                            headings: { type: "string" }
                          }
                        },
                        density: { type: "string", enum: ["compact","cozy","comfortable"] }
                      },
                      required: ["palette"]
                    },
                    brand: {
                      type: "object",
                      additionalProperties: true,
                      properties: { name: { type: "string" }, tagline: { type: "string" }, industry: { type: "string" } },
                      required: ["name","tagline"]
                    },
                    hero: {
                      type: "object",
                      additionalProperties: true,
                      properties: { title: { type: "string" }, subtitle: { type: "string" }, cta: { type: "object", additionalProperties: true } },
                      required: ["title","subtitle"]
                    },
                    about: { type: "object", additionalProperties: true },
                    features: { type: "object", additionalProperties: true },
                    gallery: { type: "object", additionalProperties: true },
                    testimonials: { type: "object", additionalProperties: true },
                    pricing: { type: "object", additionalProperties: true }
                  },
                  required: ["theme","brand","hero"]
                }
              }
            },
            { type: "function", function: { name: "updateBrief", description: "Replace the current creative brief", parameters: { type: "object", properties: { brief: { type: "string" } }, required: ["brief"] } } },
            { type: "function", function: { name: "rebuild", description: "Rebuild the site from scratch", parameters: { type: "object", properties: {} } } },
            { type: "function", function: { name: "setTheme", description: "Apply theme with palette & vibe", parameters: { type: "object", properties: { vibe: { type: "string" }, brand: { type: "string" }, accent: { type: "string" }, background: { type: "string" }, foreground: { type: "string" } }, required: ["brand","accent","background","foreground"] } } },
            { type: "function", function: { name: "addSection", description: "Add a section to the page", parameters: { type: "object", properties: { section: { type: "string" }, payload: { type: "object" } }, required: ["section"] } } },
            { type: "function", function: { name: "removeSection", description: "Remove a section from the page", parameters: { type: "object", properties: { section: { type: "string" } }, required: ["section"] } } },
            { type: "function", function: { name: "fixImages", description: "Improve or regenerate images", parameters: { type: "object", properties: { section: { type: "string" } } } } },
            { type: "function", function: { name: "applyStylePreset", description: "Apply a prebuilt style preset", parameters: { type: "object", properties: { preset: { type: "string" } }, required: ["preset"] } } },
            { type: "function", function: { name: "setTypography", description: "Change typography scale", parameters: { type: "object", properties: { font: { type: "string" } }, required: ["font"] } } },
            { type: "function", function: { name: "setDensity", description: "Adjust spacing density", parameters: { type: "object", properties: { density: { type: "string", enum: ["compact","cozy","comfortable"] } }, required: ["density"] } } },
            { type: "function", function: { name: "patchSection", description: "Modify a section with new content", parameters: { type: "object", properties: { section: { type: "string" }, content: { type: "object" } }, required: ["section","content"] } } },
            { type: "function", function: { name: "redesign", description: "Redesign the overall site layout", parameters: { type: "object", properties: { concept: { type: "string" } }, required: ["concept"] } } },
          ],
        });

        for await (const event of response) {
          const choice = event.choices?.[0];

          // Assistant narration deltas
          const contentDelta = choice?.delta?.content;
          if (typeof contentDelta === "string" && contentDelta.length > 0) {
            sendJSON(controller, { type: "assistant", delta: contentDelta });
          }

          // Tool calls (function calls)
          const toolCalls = choice?.delta?.tool_calls;
          if (Array.isArray(toolCalls)) {
            toolCalled = toolCalled || toolCalls.length > 0;
            for (const call of toolCalls) {
              const fn = call.function;
              if (!fn?.name) continue;
              let args: any = {};
              if (typeof fn.arguments === "string") {
                try { args = JSON.parse(fn.arguments); } catch { args = { raw: fn.arguments }; }
              }
              sendJSON(controller, { type: "tool", name: fn.name, args });
            }
          }
        }

        // If no tools were called, synthesize a tasteful default and stream it as a tool
        if (!toolCalled) {
          const palette = inferPaletteFrom(messages);
          const site = normalizeSite({
            theme: { vibe: "clean", palette, typography: { body: "Inter", headings: "Inter" }, density: "comfortable" },
            brand: { name: inferName(messages), tagline: "Modern, fast, and easy." },
            hero: { title: inferHeroTitle(messages), subtitle: "A polished, conversion-ready site generated for your business.", cta: { label: "Get started", href: "#" } },
            features: { title: "Why choose us", items: [
              { title: "High quality", body: "We obsess over details and durability." },
              { title: "Fast delivery", body: "From idea to live site in hours." },
              { title: "Personal support", body: "Real people who care." },
              { title: "Transparent pricing", body: "No surprises. Only value." },
            ]},
            gallery: { title: "Featured work", images: new Array(6).fill(0).map((_,i)=>({src:`/images/placeholder_${i%3+1}.jpg`, alt:""})) },
            testimonials: { title: "What customers say", items: [
              { quote: "Beautiful and fast.", author: "Project Lead" },
              { quote: "Exactly what we needed.", author: "Founder" },
              { quote: "Flawless from start to finish.", author: "Happy Client" },
            ]},
          });
          sendJSON(controller, { type: "tool", name: "setSiteData", args: site });
        }

        clearInterval(ping);
        controller.close();
      } catch (err: any) {
        clearInterval(ping);
        sendJSON(controller, { type: "error", message: err?.message || "stream error" });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}
