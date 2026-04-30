'use client';

import { useEffect, useRef, useState } from 'react';
import { useBuilder } from './builder-context';
import { streamChat } from '@/lib/aiStream';

type Msg = { role: 'user' | 'assistant'; content: string };

const EXAMPLES = [
  'A landing page for an artisan coffee shop in Brooklyn',
  'A sleek SaaS product page for a project management tool',
  'A portfolio site for a freelance photographer',
  'A modern gym website with pricing and class schedule',
];

function BotIcon() {
  return (
    <div className="w-6 h-6 rounded-full bg-[#8B5CF6]/15 flex-shrink-0 flex items-center justify-center">
      <svg className="w-3 h-3 text-[#8B5CF6]" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
      </svg>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2">
      <BotIcon />
      <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-3.5">
          {[0, 150, 300].map((delay) => (
            <span key={delay} className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: `${delay}ms` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ChatWidget() {
  const { data, brief, setBrief, rebuild, siteId, setSiteId } = useBuilder();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Derive from data instead of tracking separately — also picks up URL-loaded sites
  const hasBuilt = !!(data.hero?.title);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  const persistLatestSite = async (currentSiteId: string | null) => {
    try {
      const latest = (window as any).__sidesmithTools?.getSiteData?.() || data;
      const res = await fetch('/api/builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site: latest, brief, id: currentSiteId }),
      });
      const json = await res.json();
      if (json.ok && json.id && json.id !== currentSiteId) {
        setSiteId(json.id);
        window.history.replaceState(null, '', `?site=${json.id}`);
      }
    } catch {
      // persistence is non-critical
    }
  };

  const resetTextarea = () => {
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || busy) return;

    setError(null);
    setBusy(true);
    setInput('');
    resetTextarea();

    try {
      if (!hasBuilt) {
        setBrief(msg);
        setMessages((cur) => [...cur, { role: 'user', content: msg }]);
        await rebuild(msg);
        setMessages((cur) => [
          ...cur,
          { role: 'assistant', content: "Your site is ready. Tell me what you'd like to change." },
        ]);
        await persistLatestSite(null);
        return;
      }

      const nextMessages: Msg[] = [...messages, { role: 'user', content: msg }];
      setMessages(nextMessages);

      const res = await streamChat(nextMessages, { site: data, brief });
      setMessages((cur) => [...cur, { role: 'assistant', content: res.reply || 'Done.' }]);
      await persistLatestSite(siteId);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-white/[0.05]">
        <p className="text-[13px] text-white/50">
          {hasBuilt ? 'What would you like to change?' : 'Describe the site you want to build'}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {messages.length === 0 && !hasBuilt ? (
          <div className="space-y-2 pt-1">
            <p className="text-[11px] text-white/20 text-center pb-1">Try an example</p>
            {EXAMPLES.map((example) => (
              <button
                key={example}
                className="w-full text-left px-3.5 py-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] hover:border-white/[0.1] text-[12px] text-white/40 hover:text-white/60 transition-all duration-150"
                onClick={() => void send(example)}
                disabled={busy}
              >
                {example}
              </button>
            ))}
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className={`flex items-start gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {message.role === 'assistant' && <BotIcon />}
              <div
                className={
                  message.role === 'user'
                    ? 'bg-[#8B5CF6] text-white rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-[13px] max-w-[88%] leading-relaxed'
                    : 'bg-white/[0.04] text-white/75 rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-[13px] max-w-[88%] leading-relaxed border border-white/[0.07]'
                }
              >
                {message.content}
              </div>
            </div>
          ))
        )}

        {busy && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-400 flex-shrink-0">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 p-4 pt-3 border-t border-white/[0.05]">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            rows={1}
            className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-[13px] text-white/80 placeholder-white/20 outline-none focus:border-[#8B5CF6]/50 focus:bg-white/[0.06] transition-all resize-none leading-relaxed overflow-hidden"
            style={{ minHeight: '42px', maxHeight: '120px' }}
            disabled={busy}
            placeholder={hasBuilt ? 'Ask for a change…' : 'Describe what to build…'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = 'auto';
              t.style.height = `${Math.min(t.scrollHeight, 120)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
          />
          <button
            className="flex-shrink-0 w-[42px] h-[42px] rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all"
            disabled={busy || !input.trim()}
            onClick={() => void send()}
            aria-label="Send"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
