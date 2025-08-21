
'use client'
import Builder from '@/components/Builder'
import ChatWidget from '@/components/ChatWidget'

export default function Page() {
  return (
    <main className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="min-h-[70vh]">
          <Builder />
        </div>
        <div className="lg:sticky lg:top-6 h-[80vh]">
          <ChatWidget />
        </div>
      </div>
    </main>
  )
}
