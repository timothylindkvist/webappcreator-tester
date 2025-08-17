
import Builder from '@/components/Builder';
import { BuilderProvider } from '@/components/builder-context';
import ChatWidget from '@/components/ChatWidget';

export default function Page() {
  return (
    <BuilderProvider>
      <main>
        <Builder />
        <ChatWidget />
      </main>
    </BuilderProvider>
  );
}
