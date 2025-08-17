
'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, Card } from './ui';
import { useBuilder } from './builder-context';

type Msg = { role: 'user' | 'assistant'; content: string };

export default function ChatWidget() {
  const { brief, data: builderData, setBrief, rebuild, applyTheme, addSection, removeSection, fixImages, applyStylePreset, setTypography, setDensity, patchSection, redesign } = useBuilder();

  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: 'Describe how you want your website to be (business type, audience, tone, colors, sections)…' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string[]>([]);

  const abortRef = useRef<AbortController | null>(null);

  function pushProgress(msg: string) {
    setProgress((p) => [...p, msg].slice(-6));
  }

  async function send() {
    if (!input.trim() || loading) return;
    const next = [...messages, { role: 'user', content: input } as Msg];
    setMessages(next);
    setInput('');
    setLoading(true);
    setLastError(null);
    setProgress([]);

    const controller = new AbortController();
    abortRef.current = controller;

    // Append a placeholder assistant message to stream into
    let assistantIndex = next.length;
    setMessages((cur) => [...cur, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, state: { brief, data: builderData } }),
        signal: controller.signal
      });
      if (!res.body) throw new Error('No response stream');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx;
        while ((idx = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 1);
          if (!line) continue;
          try {
            const evt = JSON.parse(line);
            if (evt.type === 'text') {
              const delta: string = evt.delta || '';
              setMessages((cur) => {
                const copy = [...cur];
                const m = copy[assistantIndex];
                copy[assistantIndex] = { ...m, content: m.content + delta };
                return copy;
              });
            } else if (evt.type === 'tool') {
              const t = evt.data;
              // Show status chip
              pushProgress(t.type);
              // Execute the tool immediately
              switch (t.type) {
                case 'updateBrief': setBrief(t.brief); break;
                case 'rebuild': await rebuild(); break;
                case 'setTheme': applyTheme(t.palette); break;
                case 'setStylePreset': applyStylePreset(t.preset); break;
                case 'setTypography': setTypography(t.heading, t.body); break;
                case 'setDensity': setDensity(t.density); break;
                case 'patchSection': patchSection(t.section, t.content); break;
                case 'suggestPaletteFromBrand': if (t.palette) applyTheme(t.palette); break;
                case 'redesign': redesign(t.directives, t.keep); break;
                case 'addSection': addSection(t.section, t.payload); break;
                case 'removeSection': removeSection(t.section); break;
                case 'fixImages': fixImages(t.seed || 'fallback'); break;
                case 'explainError': setLastError(t.message); break;
              }
            } else if (evt.type === 'error') {
              setLastError(evt.message || 'Streaming error');
            } else if (evt.type === 'done') {
              // noop
            }
          } catch (e) {
            // ignore malformed lines
          }
        }
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        setLastError('Stopped.');
      } else {
        setLastError(e?.message || 'Chat error');
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  return (
    <Card className="fixed bottom-4 right-4 w-[28rem] overflow-hidden">
      {/* progress bar */}
      {progress.length > 0 && (
        <div className="h-1 bg-accent/30">
          <div className="h-1 bg-accent" style={{ width: `${Math.min(100, progress.length * 16)}%`, transition: 'width .2s linear' }} />
        </div>
      )}

      <div className="max-h-80 overflow-auto p-3 space-y-2">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
            <div className="inline-block rounded-xl border border-border/60 px-3 py-2 text-sm whitespace-pre-wrap">
              {m.content || (m.role === 'assistant' && loading ? '…' : '')}
            </div>
          </div>
        ))}
        {progress.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {progress.map((p, i) => <span key={i} className="rounded-full border border-border/60 px-2 py-1">{p}</span>)}
          </div>
        )}
        {lastError && <div className="text-xs text-red-500">{lastError}</div>}
      </div>

      <div className="border-t border-border/60 p-2 flex gap-2 items-center">
        <input
          className="flex-1 rounded-xl border border-border/60 bg-transparent px-3 py-2 outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tell me the business and vibe, and what to change."
          disabled={loading}
          aria-label="Chat message"
        />
        {!loading ? (
          <Button onClick={send} disabled={!input.trim()}>Send</Button>
        ) : (
          <Button type="button" onClick={stop}>Stop</Button>
        )}
      </div>
    </Card>
  );
}
