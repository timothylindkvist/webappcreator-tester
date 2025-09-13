// app/page.tsx
import Builder from '@/components/Builder';
import ChatWidget from '@/components/ChatWidget';
import { BuilderProvider } from '@/components/builder-context';

export default function Page() {
  return (
    <BuilderProvider>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 p-6">
        <div className="min-h-[70vh]">
          <Builder />
        </div>
        <div className="lg:sticky lg:top-6 h-[80vh]">
          <ChatWidget />
        </div>
      </div>
    </BuilderProvider>
  );
}
