'use client'

import Builder from '@/components/Builder'
import ChatWidget from '@/components/ChatWidget'
import { BuilderProvider } from '@/components/builder-context'
import StreamChatDemo from '@/components/StreamChatDemo'

export default function Page() {
  return (
    <BuilderProvider>
      <main className="p-6 space-y-10">
        {/* Streaming demo at the top */}
        <section>
          <StreamChatDemo />
        </section>

        {/* Your builder + chat UI */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <div className="min-h-[70vh]">
            <Builder />
          </div>
          <div className="lg:sticky lg:top-6 h-[80vh]">
            <ChatWidget />
          </div>
        </div>
      </main>
    </BuilderProvider>
  )
}
