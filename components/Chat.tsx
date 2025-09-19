'use client';
import { useState } from 'react';
import { useBuilder } from './builder-context';
import { streamChat } from '@/lib/aiStream';

type Msg = { role: 'user' | 'assistant'; content: string };

export default function Chat() {
  const { data, brief } = useBuilder();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setSending(true);
    setError(null);
    const next: Msg[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    try {
      const res = await streamChat(next, { site: data, brief });
      const withAssistant: Msg[] = [...next, { role: 'assistant', content: res.text }];
      setMessages(withAssistant);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="max-h-64 overflow-auto rounded-xl border border-slate-200 p-3 bg-white space-y-2">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <span className={
              m.role === 'user'
                ? 'inline-block rounded-2xl bg-brand text-white px-3 py-1.5'
                : 'inline-block rounded-2xl bg-slate-100 text-slate-800 px-3 py-1.5'
            }>
              {m.content}
            </span>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="muted text-sm">
            Try: <em>“Make the theme dark and add a pricing section with 3 plans.”</em>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <input
          className="input flex-1"
          placeholder="Type a change request…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
        />
        <button className="btn-primary" disabled={sending} onClick={send}>
          {sending ? 'Sending…' : 'Send'}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
