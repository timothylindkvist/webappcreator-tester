import { z } from 'zod';

export type ToolDef = {
  description: string;
  parameters?: z.ZodTypeAny;
  execute: (args: any) => Promise<any> | any;
};

export const tool = <T extends ToolDef>(t: T) => t;

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
  setSections: tool({
    description: "Replace all sections with an ordered blocks array.",
    parameters: z.object({ blocks: z.array(z.object({ id: z.string().optional(), type: z.string(), data: z.any().optional() })) }),
    async execute(args: any) { return { ok: true, applied: "setSections", count: (args?.blocks||[]).length }; },
  }),
  insertSection: tool({
    description: "Insert a section at index (ordered blocks).",
    parameters: z.object({ index: z.number().optional(), type: z.string(), data: z.any().optional(), id: z.string().optional() }),
    async execute(args: any) { return { ok: true, applied: "insertSection", type: args?.type }; },
  }),
  updateSection: tool({
    description: "Patch a block's data by id.",
    parameters: z.object({ id: z.string(), patch: z.any() }),
    async execute(args: any) { return { ok: true, applied: "updateSection", id: args?.id, patchKeys: Object.keys(args?.patch||{}) }; },
  }),
  moveSection: tool({
    description: "Move a block by id to a new index.",
    parameters: z.object({ id: z.string(), toIndex: z.number() }),
    async execute(args: any) { return { ok: true, applied: "moveSection", id: args?.id, toIndex: args?.toIndex }; },
  }),
  deleteSection: tool({
    description: "Delete a block by id.",
    parameters: z.object({ id: z.string() }),
    async execute(args: any) { return { ok: true, applied: "deleteSection", id: args?.id }; },
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
