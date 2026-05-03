import { handleToolEvents } from './toolRuntime';

export type ChatMessage = { role: 'user'|'assistant'|'system'; content: string };

export type StreamChatCtx = {
  site?: any;
  brief?: string;
  activePage?: string;
  pageHtml?: string;
  pages?: { id: string; name: string }[];
  allPagesHtml?: { id: string; name: string; html: string }[];
  screenshot?: string;
  referencedScreenshot?: string;
  referencedPageName?: string;
  referencedPageHtml?: string;
};

export async function streamChat(messages: ChatMessage[], ctx?: StreamChatCtx) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      site: ctx?.site,
      brief: ctx?.brief,
      activePage: ctx?.activePage,
      pageHtml: ctx?.pageHtml,
      pages: ctx?.pages,
      allPagesHtml: ctx?.allPagesHtml,
      screenshot: ctx?.screenshot,
      referencedScreenshot: ctx?.referencedScreenshot,
      referencedPageName: ctx?.referencedPageName,
      referencedPageHtml: ctx?.referencedPageHtml,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Chat failed: ${res.status} ${txt}`);
  }
  const json = await res.json();
  if (Array.isArray(json?.events)) { console.debug('sidesmith:events', json.events); handleToolEvents(json.events); }
  return { ok: true, reply: json?.reply || '', events: json?.events || [] };
}
