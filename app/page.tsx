"use client";

import { useState } from "react";
import { ArrowRight, Sparkles, Github } from "lucide-react";

export default function Page() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResponse(null);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) {
      setResponse("Something went wrong.");
      setLoading(false);
      return;
    }
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let full = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      full += decoder.decode(value, { stream: true });
      setResponse(full);
    }
    setLoading(false);
  }

  return (
    <main className="flex-1">
      <div className="relative">
        {/* Gradient blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-[-10%] h-64 w-64 -translate-x-1/2 rounded-full bg-purple-400/30 blur-3xl" />
          <div className="absolute right-[-10%] top-[10%] h-72 w-72 rounded-full bg-indigo-300/30 blur-3xl" />
          <div className="absolute bottom-[-10%] left-[-10%] h-80 w-80 rounded-full bg-pink-300/30 blur-3xl" />
        </div>

        <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-lg bg-gradient-to-br from-pink-400 via-orange-300 to-indigo-400" />
            <span className="text-sm font-semibold tracking-tight">Lovable-style</span>
          </div>
          <div className="flex items-center gap-2">
            <a href="https://github.com" target="_blank" className="btn">
              <Github className="h-4 w-4" /> Star on GitHub
            </a>
            <button
              onClick={() => document.documentElement.classList.toggle('dark')}
              className="btn"
            >
              Toggle Theme
            </button>
          </div>
        </nav>

        <header className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 py-16 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/60 px-3 py-1 text-xs backdrop-blur-md dark:bg-white/10">
            <Sparkles className="h-4 w-4" />
            Built with Vercel AI Gateway • GPT-5
          </span>
          <h1 className="text-balance text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Ship beautiful apps <span className="bg-gradient-to-r from-indigo-500 to-pink-500 bg-clip-text text-transparent">20× faster</span>
          </h1>
          <p className="text-pretty text-base text-black/70 dark:text-white/70 sm:text-lg">
            A modern, production-ready Next.js starter inspired by lovable.dev—clean layout, glassy cards, soft shadows, and streaming AI responses.
          </p>

          <form onSubmit={onSubmit} className="card grid w-full max-w-2xl grid-cols-1 gap-2 p-2 sm:grid-cols-[1fr_auto]">
            <input
              className="h-12 w-full rounded-xl bg-muted px-4 outline-none"
              placeholder="Ask the app to generate something…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button className="btn btn-primary h-12">
              {loading ? "Thinking..." : <>Ask AI <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>
        </header>

        <section className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-6 pb-16 sm:grid-cols-3">
          {[
            { title: "Fast", desc: "Edge runtime, optimized streaming, instant feedback." },
            { title: "Stylish", desc: "Soft shadows, rounded corners, gradient accents." },
            { title: "Safe Keys", desc: "No secrets in code. Use Vercel AI Gateway env vars." }
          ].map((c) => (
            <div key={c.title} className="card p-6">
              <h3 className="mb-2 text-lg font-semibold">{c.title}</h3>
              <p className="text-sm text-black/70 dark:text-white/70">{c.desc}</p>
            </div>
          ))}
        </section>

        {response && (
          <section className="mx-auto w-full max-w-4xl px-6 pb-24">
            <div className="card p-6">
              <h3 className="mb-2 font-semibold">Response</h3>
              <pre className="whitespace-pre-wrap text-sm">{response}</pre>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
