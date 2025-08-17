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

export async function POST(req: NextRequest) {
  const { messages = [], state } = await req.json();

  // Strong directive: ask briefly, then ACT by calling tools
  const systemMsg = {
    role: "system" as const,
    content: [
      "You are a senior product designer + copywriter for SMB websites.",
      "RULES:",
      "1) Always ask up to 3 SHORT clarifying questions (bulleted).",
      "2) Do not block: immediately proceed with a polished first draft by CALLING TOOLS to apply changes (setSiteData for full draft; setTheme/addSection/patchSection/etc for edits).",
      "3) Use benefit-led copy, scannable bullets, strong hero, 4–6 sections minimum.",
      "4) Always pick a coherent palette, typography, CTAs, and relevant imagery placeholders.",
      "5) If user is very detailed, follow exactly; if vague, choose tasteful defaults and still CALL TOOLS.",
    ].join(" ")
  };

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // Keep-alive ping to avoid edge timeouts
      const ping = setInterval(() => {
        try { controller.enqueue(new TextEncoder().encode(":ping\n")); } catch { clearInterval(ping); }
      }, 15000);

      try {
        const response = await client.chat.completions.create({
          model: process.env.NEXT_PUBLIC_AI_MODEL || "gpt-5"
          stream: true,
          temperature: 0.6,
          tool_choice: "auto",
          parallel_tool_calls: true,
          messages: [systemMsg, ...messages],
          tools: [
            {
              type: "function",
              function: {
                name: "setSiteData",
                description: "Replace the entire site with a complete, polished website.",
                parameters: {
                  type: "object",
                  additionalProperties: true, // permissive to avoid schema rejections
                  properties: {
                    theme: { type: "object", additionalProperties: true },
                    brand: { type: "object", additionalProperties: true },
                    hero:  { type: "object", additionalProperties: true },
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
