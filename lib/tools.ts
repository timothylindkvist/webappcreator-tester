// lib/tools.ts
import { tool } from "ai";
import { z } from "zod";

/**
 * Tool definitions that the assistant can call.
 * These map 1:1 to actions inside <BuilderProvider/> (components/builder-context.tsx)
 * We don't actually mutate server state here; the client listens to tool events
 * and applies changes locally. Returning small JSON payloads keeps the stream happy.
 */
export const toolDefs = {
  setSiteData: tool({
    description: "Replace the entire site data object (all sections, theme, etc.).",
    parameters: z.any(),
    execute: async (args) => ({ ok: true, applied: "setSiteData", size: typeof args === "object" ? Object.keys(args || {}).length : 0 }),
  }),
  updateBrief: tool({
    description: "Update the creative brief the user provided.",
    parameters: z.object({ brief: z.string().min(1) }),
    execute: async (args) => ({ ok: true, applied: "updateBrief", briefLen: args.brief.length }),
  }),
  addSection: tool({
    description: "Add a new section by key with optional payload.",
    parameters: z.object({ section: z.string(), payload: z.any().optional() }),
    execute: async (args) => ({ ok: true, applied: "addSection", section: args.section }),
  }),
  removeSection: tool({
    description: "Remove a section by key.",
    parameters: z.object({ section: z.string() }),
    execute: async (args) => ({ ok: true, applied: "removeSection", section: args.section }),
  }),
  patchSection: tool({
    description: "Patch a section by key with a JSON patch (shallow-merge).",
    parameters: z.object({ section: z.string(), patch: z.any() }),
    execute: async (args) => ({ ok: true, applied: "patchSection", section: args.section }),
  }),
  applyTheme: tool({
    description: "Apply a full theme or just a palette update.",
    parameters: z.object({
      vibe: z.string().optional(),
      palette: z.object({
        brand: z.string().optional(),
        accent: z.string().optional(),
        background: z.string().optional(),
        foreground: z.string().optional(),
      }).partial().optional(),
      typography: z.object({
        body: z.string().optional(),
        headings: z.string().optional(),
      }).partial().optional(),
      density: z.enum(["compact","cozy","comfortable"]).optional(),
    }).partial(),
    execute: async () => ({ ok: true, applied: "applyTheme" }),
  }),
  setTypography: tool({
    description: "Set body and heading fonts.",
    parameters: z.object({
      body: z.string().optional(),
      headings: z.string().optional(),
    }).partial(),
    execute: async () => ({ ok: true, applied: "setTypography" }),
  }),
  setDensity: tool({
    description: "Set the density scale for spacing.",
    parameters: z.object({ density: z.enum(["compact","cozy","comfortable"]) }),
    execute: async (args) => ({ ok: true, applied: "setDensity", density: args.density }),
  }),
  fixImages: tool({
    description: "Ensure all gallery/section images have a valid src and caption.",
    parameters: z.object({ section: z.string().optional() }).partial(),
    execute: async () => ({ ok: true, applied: "fixImages" }),
  }),
  redesign: tool({
    description: "High-level concept change (e.g., 'brutalist', 'editorial').",
    parameters: z.object({ concept: z.string().optional() }).partial(),
    execute: async () => ({ ok: true, applied: "redesign" }),
  }),
} as const;
