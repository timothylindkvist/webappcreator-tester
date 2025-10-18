'use client';
import { useState, useEffect } from 'react';
import { useBuilder } from './builder-context';
import { streamChat } from '@/lib/aiStream';

type Msg = { role: 'user' | 'assistant'; content: string };

export default function ChatWidget() {
  const { data, brief, setBrief, rebuild, reset } = useBuilder();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasBuilt, setHasBuilt] = useState(false);

  // Start a fresh session on mount
  useEffect(() => {
    setMessages([]);
    setHasBuilt(false);
    setError(null);
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setError(null);
    setBusy(true);

    try {
      if (!hasBuilt) {
        // Treat the first message as the creative brief; build the initial site via API
        setBrief(text);
        setMessages((m) => [...m, { role: 'user', content: text }]);
        setInput('');
        await rebuild(text);
        setMessages((m) => [...m, { role: 'assistant', content: '✅ Generated the first version of your site from that brief. Tell me what to change next.' }]);
        setHasBuilt(true);
      } else {
        // Subsequent messages are incremental edits via /api/chat
        const next: Msg[] = [...messages, { role: 'user', content: text }];
        setMessages(next);
        setInput('');
        
const res = await streamChat(next, { site: data, brief });
// apply events from AI (FIX8, inside async handler before JSX)
if (res?.events && Array.isArray(res.events)) {
  for (const ev of res.events) {
    const id = ev.id || 'custom_section';

    if (ev.action === 'add_section') {
      const payload = ev.payload || { title: ev.title, content: ev.content, html: ev.html };
      (window as any).__sidesmithTools?.setSiteData({ [id]: payload });
    } else if (ev.action === 'update_section') {
      const payload = ev.payload || { title: ev.title, content: ev.content, html: ev.html };
      (window as any).__sidesmithTools?.setSiteData({ [id]: payload });
    } else if (ev.action === 'remove_section') {
      (window as any).__sidesmithTools?.setSiteData({ [id]: undefined });
    }
  }

  try {
    const latest = (window as any).__sidesmithTools?.getSiteData?.() || {};
    await fetch('/api/builder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site: latest, brief }),
    });
  } catch (e) {
    console.error('Failed to persist builder state:', e);
  }
}
setMessages((m) => [...m, { role: 'assistant', content: res.text || '✅ Done.' }]);
      }
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="max-h-80 overflow-auto rounded-xl border border-slate-200 p-3 bg-transparent space-y-2">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <span className={
              m.role === 'user'
                ? 'inline-block rounded-2xl bg-[var(--brand)] text-white px-3 py-1.5'
                : 'inline-block rounded-2xl bg-transparent text-[var(--foreground)] border border-white/20 px-3 py-1.5'
            }
        // persist builder state
        try {
          const latest = (window as any).__sidesmithTools?.getSiteData?.() || {};
          await fetch('/api/builder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ site: latest, brief }),
          });
        } catch (e) {
          console.error('Failed to persist builder state:', e);
        }>
              {m.content}
            </span>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="muted text-sm">
            Start by telling me what to build. Example: “A sleek landing page for a yoga studio in Stockholm with a pricing section and a contact form.”
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <input
          className="input flex-1"
          disabled={busy}
          placeholder={hasBuilt ? "Type an edit… e.g., “Make the theme pink and change the hero title.”" : "Describe the website you want to build…"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
        />
        <button className="btn-primary" disabled={busy} onClick={send}>
          {busy ? 'Working…' : (hasBuilt ? 'Send' : 'Build')}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
