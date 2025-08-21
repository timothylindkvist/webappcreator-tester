'use client'

import Builder from '@/components/Builder'
import ChatWidget from '@/components/ChatWidget'
import { BuilderProvider } from '@/components/builder-context'

>>>>>>> bca90faad890ea65b9a7059caf10c0e171881ae6
export default function Page() {
  return (
<<<<<<< HEAD
    <BuilderProvider>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 p-6">
        <div className="min-h-[70vh]">
          <Builder />
=======
    <BuilderProvider>
      <main className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <div className="min-h-[70vh]">
            <Builder />
          </div>
          <div className="lg:sticky lg:top-6 h-[80vh]">
            <ChatWidget />
          </div>
>>>>>>> bca90faad890ea65b9a7059caf10c0e171881ae6
        </div>
<<<<<<< HEAD
        <div className="lg:sticky lg:top-6 h-[80vh]">
          <ChatWidget />
        </div>
      </div>
    </BuilderProvider>
  );
=======
      </main>
    </BuilderProvider>
  )
>>>>>>> bca90faad890ea65b9a7059caf10c0e171881ae6
}
