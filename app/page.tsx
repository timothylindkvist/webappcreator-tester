'use client';
import { BuilderProvider } from '../components/builder-context';
import Builder from '../components/Builder';
import ResizableChat from '../components/ResizableChat';
import Background from '../components/Background';
import ChangeBackgroundButtons from '../components/ui/ChangeBackgroundButtons';

export default function Page() {
  return (
    <BuilderProvider>
      <div className="container py-6 md:py-10">
        <Background />
        <ChangeBackgroundButtons />
        <header className="card bg-[var(--background)] text-[var(--foreground)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="pill">Sidesmith</div>
              <h1 className="title text-[var(--brand)] mt-2">Website Creator</h1>
              <p className="subtitle mt-1">Chat to build the first version, then keep editing with more messages.</p>
            </div>
          </div>
        </header>

        <div className="card"><Builder /></div>

        <footer className="text-center mt-8 text-sm muted">
          Built with Next.js + OpenAI.
        </footer>
            <ResizableChat />
      </div>
    </BuilderProvider>
  );
}
