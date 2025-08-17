
'use client';

import { useState } from 'react';
import { Button, Card } from './ui';
import { useBuilder } from './builder-context';

type Msg = { role: 'user' | 'assistant'; content: string };

export default function ChatWidget() {
  const { setBrief, rebuild, applyTheme, addSection, removeSection, fixImages } = useBuilder();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  async function send() {
    if (!input.trim()) return;
    const next = [...messages, { role: 'user', content: input } as Msg];
    setMessages(next);
    setInput('');
    setLoading(true);
    setLastError(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, state: {} }),
      });
      const data = await res.json();

      // Apply tool instructions
      if (Array.isArray(data.tools)) {
        for (const t of data.tools) {
          switch (t.type) {
            case 'updateBrief':
              setBrief(t.brief);
              break;
            case 'rebuild':
              await rebuild();
              break;
            case 'setTheme':
              applyTheme(t.palette);
              break;
            case 'addSection':
              addSection(t.section, t.payload);
              break;
            case 'removeSection':
              removeSection(t.section);
              break;
            case 'fixImages':
              fixImages(t.seed || 'fallback');
              break;
            case 'explainError':
              setLastError(t.message);
              break;
          }
        }
      }

      setMessages((cur) => [...cur, { role: 'assistant', content: data.assistant || 'Done.' }]);
    } catch (e: any) {
      setLastError(e.message || 'Chat error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 overflow-hidden">
      <div className="max-h-80 overflow-auto p-3 space-y-2">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
            <div className="inline-block rounded-xl border border-border/60 px-3 py-2 text-sm">
              {m.content}
            </div>
          </div>
        ))}
        {lastError && (
          <div className="text-xs text-red-500">{lastError}</div>
        )}
      </div>
      <div className="border-t border-border/60 p-2 flex gap-2">
        <input
          className="flex-1 rounded-xl border border-border/60 bg-transparent px-3 py-2 outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask to change colors, add pricing, rebuild, etc."
          disabled={loading}
        />
        <Button onClick={send} disabled={loading}>Send</Button>
      </div>
    </Card>
  );
}
