"use client";

import { useState } from "react";

export default function EditorPage() {
  const [html, setHtml] = useState("<h1>Hello world</h1>");
  const [css, setCss] = useState("h1 { color: white; }");

  return (
    <main className="mx-auto grid min-h-[calc(100dvh-3.5rem)] max-w-7xl grid-rows-[auto,1fr] gap-4 px-4 py-6 sm:px-6 lg:px-8">
      <div className="glass rounded-3xl p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-white/70">Website Creator</div>
          <div className="flex gap-2">
            <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10">Preview</button>
            <button className="rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 px-3 py-1.5 text-sm font-semibold">Publish</button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass rounded-3xl p-4">
          <div className="mb-2 text-xs text-white/60">HTML</div>
          <textarea className="h-[360px] w-full resize-none rounded-xl bg-black/40 p-3 text-sm outline-none" value={html} onChange={e => setHtml(e.target.value)} />
          <div className="mt-4 mb-2 text-xs text-white/60">CSS</div>
          <textarea className="h-[220px] w-full resize-none rounded-xl bg-black/40 p-3 text-sm outline-none" value={css} onChange={e => setCss(e.target.value)} />
        </div>
        <div className="glass rounded-3xl p-0 overflow-hidden">
          <iframe
            title="preview"
            className="min-h-[600px] w-full"
            srcDoc={`<!doctype html><html><head><style>${css}</style></head><body style="background:#0B0B0C;color:white;padding:24px">${html}</body></html>`}
          />
        </div>
      </div>
    </main>
  );
}
