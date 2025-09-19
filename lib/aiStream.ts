import { handleToolEvents } from './toolRuntime';

export type ChatMessage = { role: 'user'|'assistant'|'system'; content: string };

export async function streamChat(messages: ChatMessage[], ctx?: { site?: any; brief?: string }) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, site: ctx?.site, brief: ctx?.brief })
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Chat failed: ${res.status} ${txt}`);
  }
  const json = await res.json();
  if (Array.isArray(json?.events)) { console.debug('sidesmith:events', json.events); handleToolEvents(json.events); }
  return { ok: true, text: json?.reply || '' };
}
