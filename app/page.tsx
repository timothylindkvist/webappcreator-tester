'use client';
import { BuilderProvider } from '../components/builder-context';
import Builder from '../components/Builder';
import ResizableChat from '../components/ResizableChat';
import Background from '../components/Background';

export default function Page() {
  return (
    <BuilderProvider>
      <div className="container py-6">
        

        <div className="card"><Builder /></div>

        <footer className="text-center mt-8 text-sm muted">
          Built with Next.js + OpenAI.
        </footer>
            <ResizableChat />
      </div>
    </BuilderProvider>
  );
}
