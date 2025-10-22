// Client-side tool runtime that dispatches tool events to the BuilderProvider.
// BuilderProvider registers handlers on window.__sidesmithTools when it mounts.
export type ToolEvent = { name: string; args: any };

type Bridge = {
  setSiteData?: (args: any) => void;
  updateBrief?: (args: any) => void;
  applyTheme?: (args: any) => void;
  addSection?: (args: any) => void;
  removeSection?: (args: any) => void;
  patchSection?: (args: any) => void;
  setSections?: (args: any) => void;
  insertSection?: (args: any) => void;
  updateSection?: (args: any) => void;
  moveSection?: (args: any) => void;
  deleteSection?: (args: any) => void;
};

declare global {
  interface Window { __sidesmithTools?: Bridge }
}

export function handleToolEvent(evt: ToolEvent) {
  const b = (typeof window !== 'undefined' ? window.__sidesmithTools : undefined) || {};
  const fn = (b as any)[evt.name];
  if (typeof fn === 'function') {
    fn(evt.args ?? {});
  } else {
    console.warn('No handler for tool', evt.name, 'args:', evt.args);
  }
}

export function handleToolEvents(events: ToolEvent[] = []) {
  for (const e of events) handleToolEvent(e);
}
