import { z } from 'zod';

// Minimal tool type + helper that happily accepts an `execute` function.
export type ToolDef = {
  description: string;
  parameters?: z.ZodTypeAny;
  execute: (args: any) => Promise<any> | any;
};

export const tool = <T extends ToolDef>(t: T) => t;

// A tiny set of no-op tools that just echo what would be applied in UI.
// These are intentionally framework-agnostic so they compile on Vercel.
export const tools = {
  setSiteData: tool({
    description: "Replace the entire site data object (all sections, theme, etc.).",
    parameters: z.any(),
    async execute(args: any) {
      return { ok: true, applied: "setSiteData", size: typeof args === "object" ? Object.keys(args || {}).length : 0 };
    },
  }),
  updateBrief: tool({
    description: "Update the creative brief the user provided.",
    parameters: z.object({ brief: z.string() }).partial(),
    async execute(args: any) {
      return { ok: true, applied: "updateBrief", brief: args?.brief ?? "" };
    },
  }),
  applyTheme: tool({
    description: "Merge a theme patch into the current theme.",
    parameters: z.object({
      vibe: z.string().optional(),
      palette: z.object({
        brand: z.string().optional(),
        accent: z.string().optional(),
        background: z.string().optional(),
        foreground: z.string().optional(),
      }).partial().optional(),
      typography: z.object({ body: z.string().optional(), headings: z.string().optional() }).partial().optional(),
      density: z.enum(["compact", "cozy", "comfortable"]).optional(),
    }).partial(),
    async execute(args: any) {
      return { ok: true, applied: "applyTheme", patchKeys: Object.keys(args || {}) };
    },
  }),
  addSection: tool({
    description: "Add a section by key with payload.",
    parameters: z.object({ section: z.string(), payload: z.any().optional() }),
    async execute(args: any) {
      return { ok: true, applied: "addSection", section: args?.section };
    },
  }),
  removeSection: tool({
    description: "Remove a section by key.",
    parameters: z.object({ section: z.string() }),
    async execute(args: any) {
      return { ok: true, applied: "removeSection", section: args?.section };
    },
  }),
  patchSection: tool({
    description: "Patch a section by key.",
    parameters: z.object({ section: z.string(), patch: z.any() }),
    async execute(args: any) {
      return { ok: true, applied: "patchSection", section: args?.section, patchKeys: Object.keys(args?.patch || {}) };
    },
  }),
};

export type ToolName = keyof typeof tools;
