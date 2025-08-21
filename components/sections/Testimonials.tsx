
'use client'
export default function Testimonials({ quote, author, items = [] as { quote: string; author?: string }[] }:
  { quote?: string; author?: string; items?: { quote: string; author?: string }[] }) {
  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-4xl space-y-4">
        <h2 className="text-2xl font-bold sm:text-3xl">Testimonials</h2>
        {quote && <blockquote className="rounded-xl border border-white/10 bg-white/5 p-4">{quote} — <span className="text-muted-foreground">{author}</span></blockquote>}
        {items.map((t, i) => <blockquote key={i} className="rounded-xl border border-white/10 bg-white/5 p-4">{t.quote} — <span className="text-muted-foreground">{t.author}</span></blockquote>)}
      </div>
    </section>
  )
}
