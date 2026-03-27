'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    setMessages([]);
    setHasBuilt(false);
    setError(null);
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistLatestSite = async () => {
    try {
      const latest = (window as any).__sidesmithTools?.getSiteData?.() || data;
      await fetch('/api/builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site: latest, brief }),
      });
    } catch (e) {
      console.error('Failed to persist builder state:', e);
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;

    setError(null);
    setBusy(true);

    try {
      if (!hasBuilt) {
        setBrief(text);
        setMessages((current) => [...current, { role: 'user', content: text }]);
        setInput('');
        await rebuild(text);
        setMessages((current) => [
          ...current,
          { role: 'assistant', content: 'Generated the first version of your site. Tell me what to change next.' },
        ]);
        setHasBuilt(true);
        await persistLatestSite();
        return;
      }

      const nextMessages: Msg[] = [...messages, { role: 'user', content: text }];
      setMessages(nextMessages);
      setInput('');

      const res = await streamChat(nextMessages, { site: data, brief });
      setMessages((current) => [...current, { role: 'assistant', content: res.reply || 'Done.' }]);
      await persistLatestSite();
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="max-h-80 overflow-auto rounded-xl border border-slate-200 p-3 bg-transparent space-y-2">
        {messages.map((message, index) => (
          <div key={index} className={message.role === 'user' ? 'text-right' : 'text-left'}>
            <span
              className={
                message.role === 'user'
                  ? 'inline-block rounded-2xl bg-[var(--brand)] px-3 py-1.5 text-white'
                  : 'inline-block rounded-2xl border border-white/20 px-3 py-1.5 text-[var(--foreground)]'
              }
            >
              {message.content}
            </span>
          </div>
        ))}
        {messages.length === 0 ? (
          <div className="muted text-sm">
            Start by telling me what to build. Example: “A sleek landing page for a yoga studio in Stockholm with pricing and a contact section.”
          </div>
        ) : null}
      </div>

      <div className="flex gap-2">
        <input
          className="input flex-1"
          disabled={busy}
          placeholder={hasBuilt ? 'Type an edit request…' : 'Describe the website you want to build…'}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void send();
            }
          }}
        />
        <button className="btn-primary" disabled={busy} onClick={() => void send()}>
          {busy ? 'Working…' : hasBuilt ? 'Send' : 'Build'}
        </button>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
