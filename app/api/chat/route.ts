export const runtime = "edge";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function sendJSON(controller: ReadableStreamDefaultController<Uint8Array>, obj: any) {
  const enc = new TextEncoder();
  controller.enqueue(enc.encode(JSON.stringify(obj) + "\n\n"));
}

export async function POST(req: NextRequest) {
  const { messages, state } = await req.json();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // 🔄 keep-alive pings
      const ping = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(":ping\n\n"));
        } catch {
          clearInterval(ping);
        }
      }, 15000);

      try {
        const response = await client.chat.completions.create({
          model: process.env.NEXT_PUBLIC_AI_MODEL || "gpt-4o-mini",
          messages,
          stream: true,
          tools: [
            { type: "function", function: { name: "updateBrief", description: "Replace the current creative brief", parameters: { type: "object", properties: { brief: { type: "string" } }, required: ["brief"] } } },
            { type: "function", function: { name: "rebuild", description: "Rebuild the site from scratch", parameters: { type: "object", properties: {} } } },
            { type: "function", function: { name: "setTheme", description: "Apply theme with palette & vibe", parameters: { type: "object", properties: { vibe: { type: "string" }, brand: { type: "string" }, accent: { type: "string" }, background: { type: "string" }, foreground: { type: "string" } }, required: ["brand","accent","background","foreground"] } } },
            { type: "function", function: { name: "addSection", description: "Add a section to the page", parameters: { type: "object", properties: { section: { type: "string" } }, required: ["section"] } } },
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
                try {
                  args = JSON.parse(fn.arguments);
                } catch {
                  args = { raw: fn.arguments };
                }
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
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}
