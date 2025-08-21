
'use client'
export default function FAQ({ items = [] as { q: string; a: string }[] }: { items?: { q: string; a: string }[] }) {
  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-2xl font-bold sm:text-3xl">FAQ</h2>
        <div className="mt-6 space-y-3">
          {items.map((it, i) => (
            <details key={i} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <summary className="cursor-pointer font-semibold">{it.q}</summary>
              <div className="text-sm text-muted-foreground mt-2">{it.a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
