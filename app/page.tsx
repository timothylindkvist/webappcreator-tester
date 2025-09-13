'use client';
import { BuilderProvider } from '../components/builder-context';
import Builder from '../components/Builder';
import ChatWidget from '../components/ChatWidget';

export default function Page() {
  return (
    <BuilderProvider>
      <div className="container">
        <header className="card" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
          <h1 style={{ margin: 0, color: 'var(--brand)' }}>Sidesmith</h1>
          <p style={{ marginTop: 8, opacity: 0.8 }}>Describe your site on the right, then generate.</p>
        </header>
        <div className="grid">
          <div className="card"><Builder /></div>
          <div className="card"><ChatWidget /></div>
        </div>
        <footer style={{ marginTop: 24, opacity: 0.6, fontSize: 12 }}>
          Built with Next.js + OpenAI.
        </footer>
      </div>
    </BuilderProvider>
  );
}
