'use client';
import { BuilderProvider } from '../components/builder-context';
import Builder from '../components/Builder';
import ChatWidget from '../components/ChatWidget';

export default function Page() {
  return (
    <BuilderProvider>
      <div className="container py-6 md:py-10">
        <header className="card bg-[var(--background)] text-[var(--foreground)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="pill">Sidesmith</div>
              <h1 className="title text-[var(--brand)] mt-2">Website Creator</h1>
              <p className="subtitle mt-1">Chat to build the first version, then keep editing with more messages.</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6 mt-6">
          <div className="card"><Builder /></div>
          <div className="card lg:sticky lg:top-6 h-fit"><ChatWidget /></div>
        </div>

        <footer className="text-center mt-8 text-sm muted">
          Built with Next.js + OpenAI.
        </footer>
      </div>
    </BuilderProvider>
  );
}
