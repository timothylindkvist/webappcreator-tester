'use client';
import { BuilderProvider } from '../components/builder-context';
import Builder from '../components/Builder';
import ResizableChat from '../components/ResizableChat';
import Background from '../components/Background';
import ChangeBackgroundButtons from '../components/ui/ChangeBackgroundButtons';

export default function Page() {
  return (
    <BuilderProvider>
      <div className="container py-6 md:py-10 relative z-10 min-h-screen">
        <Builder />

        <footer className="text-center mt-8 text-sm muted">
          Built with Next.js + OpenAI.
        </footer>
            <ResizableChat />
      </div>
    </BuilderProvider>
  );
}
