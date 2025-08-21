
'use client'
export default function Features({ title, items = [] as { title: string; body: string }[] }: { title: string; items?: { title: string; body: string }[] }) {
  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((it, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="font-semibold">{it.title}</div>
              <div className="text-sm text-muted-foreground">{it.body}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
