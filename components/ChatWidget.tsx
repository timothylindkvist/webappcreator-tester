'use client';

import { useEffect, useRef, useState } from 'react';
import { useBuilder } from './builder-context';
import { streamChat } from '@/lib/aiStream';

type Msg = { role: 'user' | 'assistant'; content: string };
type CreationStep = 'idle' | 'generating-brief' | 'briefing' | 'live';

const EXAMPLES = [
  'A landing page for an artisan coffee shop in Brooklyn',
  'A sleek SaaS product page for a project management tool',
  'A portfolio site for a freelance photographer',
  'A modern gym website with pricing and class schedule',
];

const COLOR_PRESETS = [
  { name: 'Purple', brand: '#7c3aed', accent: '#06b6d4' },
  { name: 'Coral', brand: '#e05252', accent: '#f97316' },
  { name: 'Blue', brand: '#2563eb', accent: '#0ea5e9' },
  { name: 'Green', brand: '#16a34a', accent: '#10b981' },
  { name: 'Slate', brand: '#334155', accent: '#64748b' },
];

function BotIcon() {
  return (
    <div className="w-6 h-6 rounded-full bg-[#ede9fe] flex-shrink-0 flex items-center justify-center">
      <svg className="w-3 h-3 text-[#7c3aed]" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
      </svg>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2">
      <BotIcon />
      <div className="bg-white border border-zinc-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-3.5">
          {[0, 150, 300].map((delay) => (
            <span key={delay} className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-bounce" style={{ animationDelay: `${delay}ms` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function BriefEditor({
  briefText,
  onChange,
  onGenerate,
  onBack,
  busy,
}: {
  briefText: string;
  onChange: (val: string) => void;
  onGenerate: () => void;
  onBack: () => void;
  busy: boolean;
}) {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-[#ede9fe] flex items-center justify-center flex-shrink-0">
          <svg className="w-2.5 h-2.5 text-[#7c3aed]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <p className="text-[12px] font-semibold text-zinc-600">Design brief — edit if you'd like</p>
      </div>
      <textarea
        value={briefText}
        onChange={(e) => onChange(e.target.value)}
        rows={7}
        className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-[12px] leading-relaxed text-zinc-700 outline-none transition-colors focus:border-[#7c3aed]/50 focus:bg-white"
      />
      <div className="flex gap-2">
        <button
          disabled={busy}
          onClick={onGenerate}
          className="flex-1 rounded-xl bg-[#7c3aed] py-2.5 text-[13px] font-semibold text-white disabled:opacity-50"
        >
          {busy ? 'Building your site…' : 'Generate website →'}
        </button>
        <button
          disabled={busy}
          onClick={onBack}
          className="rounded-xl border border-zinc-200 px-4 py-2.5 text-[13px] text-zinc-500 hover:bg-zinc-50 disabled:opacity-50"
        >
          Back
        </button>
      </div>
    </div>
  );
}

export default function ChatWidget() {
  const { data, brief, setBrief, rebuild, siteId, setSiteId, applyTheme } = useBuilder();
  const [step, setStep] = useState<CreationStep>('idle');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [briefText, setBriefText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // If site is pre-loaded (via URL), skip straight to chat
  const hasContent = !!(data.hero?.title);
  useEffect(() => {
    if (hasContent && step === 'idle') setStep('live');
  }, [hasContent]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, step, busy]);

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
    } catch { /* non-critical */ }
  };

  const resetTextarea = () => {
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  // Step 1: user sends description → generate brief via AI
  const startCreationFlow = async (desc: string) => {
    setMessages([{ role: 'user', content: desc }]);
    setInput('');
    resetTextarea();
    setBusy(true);
    setStep('generating-brief');

    try {
      const res = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: desc }),
      });
      const json = await res.json();

      if (json.ok && json.brief) {
        setBriefText(json.brief);
        setMessages((cur) => [
          ...cur,
          { role: 'assistant', content: "Here's a design brief based on your idea. Edit it if you'd like, then generate your site." },
        ]);
        setStep('briefing');
      } else {
        // Brief generation failed — fall back to direct generate
        await doGenerate(desc);
      }
    } catch {
      await doGenerate(desc);
    } finally {
      setBusy(false);
    }
  };

  // Direct generate without showing brief (fallback or on "Back" from briefing)
  const doGenerate = async (briefOverride?: string) => {
    const nextBrief = briefOverride ?? briefText;
    setBrief(nextBrief);
    try {
      await rebuild(nextBrief);
      setMessages((cur) => [
        ...cur,
        { role: 'assistant', content: "Your site is ready! Tell me what you'd like to change." },
      ]);
      setStep('live');
      await persistLatestSite(null);
    } catch (e: any) {
      setError(e?.message ?? String(e));
      setStep('idle');
    }
  };

  // Step 2: user clicks Generate from brief editor
  const generateFromBrief = async () => {
    setBusy(true);
    setError(null);
    await doGenerate(briefText);
    setBusy(false);
  };

  // Chat after site is live
  const sendChat = async (msg: string) => {
    const nextMessages: Msg[] = [...messages, { role: 'user', content: msg }];
    setMessages(nextMessages);
    setInput('');
    resetTextarea();
    setBusy(true);
    try {
      const res = await streamChat(nextMessages, { site: data, brief });
      setMessages((cur) => [...cur, { role: 'assistant', content: res.reply || 'Done.' }]);
      await persistLatestSite(siteId);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || busy) return;
    setError(null);
    if (step === 'idle') { await startCreationFlow(msg); return; }
    if (step === 'live') { await sendChat(msg); }
  };

  const isLive = step === 'live';

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#f8f8fb]">
      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-4 pb-3.5 border-b border-zinc-200/70">
        <p className="text-[13px] font-medium text-zinc-500">
          {isLive ? 'What would you like to change?' : 'Describe the site you want to build'}
        </p>
      </div>

      {/* Colour theme switcher — live only */}
      {isLive && (
        <div className="flex-shrink-0 px-5 py-3 border-b border-zinc-100 flex items-center gap-2.5">
          <span className="text-[11px] font-medium text-zinc-400 tracking-wide">Colour</span>
          <div className="flex gap-2 ml-1">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.name}
                title={preset.name}
                onClick={() =>
                  applyTheme({
                    palette: {
                      brand: preset.brand,
                      accent: preset.accent,
                      background: data.theme.palette.background,
                      foreground: data.theme.palette.foreground,
                    },
                  })
                }
                className="w-[18px] h-[18px] rounded-full transition-transform hover:scale-110 active:scale-95"
                style={{
                  backgroundColor: preset.brand,
                  outline: data.theme.palette.brand === preset.brand ? `2px solid ${preset.brand}` : 'none',
                  outlineOffset: '2px',
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Messages + interactive steps */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {/* Example prompts — idle only */}
        {step === 'idle' && messages.length === 0 && (
          <div className="space-y-2 pt-1">
            <p className="text-[11px] text-zinc-400 text-center pb-1">Try an example</p>
            {EXAMPLES.map((example) => (
              <button
                key={example}
                className="w-full text-left px-3.5 py-3 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-zinc-300 text-[12px] text-zinc-500 hover:text-zinc-700 transition-all shadow-sm"
                onClick={() => void send(example)}
                disabled={busy}
              >
                {example}
              </button>
            ))}
          </div>
        )}

        {/* Chat history */}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex items-start gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {message.role === 'assistant' && <BotIcon />}
            <div
              className={
                message.role === 'user'
                  ? 'bg-[#ede9fe] text-[#3b0764] rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-[13px] max-w-[88%] leading-relaxed'
                  : 'bg-white text-zinc-700 rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-[13px] max-w-[88%] leading-relaxed border border-zinc-100 shadow-sm'
              }
            >
              {message.content}
            </div>
          </div>
        ))}

        {/* Brief generation spinner */}
        {step === 'generating-brief' && busy && (
          <div className="flex items-start gap-2">
            <BotIcon />
            <div className="bg-white border border-zinc-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 text-[13px] text-zinc-500">
              Crafting your design brief…
            </div>
          </div>
        )}

        {/* Brief editor */}
        {step === 'briefing' && (
          <BriefEditor
            briefText={briefText}
            onChange={setBriefText}
            onGenerate={generateFromBrief}
            onBack={() => { setStep('idle'); setMessages([]); }}
            busy={busy}
          />
        )}

        {busy && step === 'live' && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 text-[12px] text-red-700 flex-shrink-0 space-y-1">
          <p className="font-medium">Something went wrong — please try again.</p>
          <p className="text-red-500 font-mono text-[10px] break-all leading-relaxed">{error}</p>
        </div>
      )}

      {/* Input — idle and live only */}
      {(step === 'idle' || step === 'live') && (
        <div className="flex-shrink-0 p-4 pt-3 border-t border-zinc-200/70 bg-white">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              rows={1}
              className="flex-1 bg-[#f8f8fb] border border-zinc-200 rounded-xl px-3.5 py-2.5 text-[13px] text-zinc-800 placeholder-zinc-400 outline-none focus:border-[#8B5CF6]/60 focus:bg-white transition-all resize-none leading-relaxed overflow-hidden"
              style={{ minHeight: '42px', maxHeight: '120px' }}
              disabled={busy}
              placeholder={isLive ? 'Ask for a change…' : 'Describe what to build…'}
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
              className="flex-shrink-0 w-[42px] h-[42px] rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-sm"
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
      )}
    </div>
  );
}
