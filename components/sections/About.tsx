
'use client'
export default function About({ heading, body, bullets = [] as string[] }: { heading: string; body: string; bullets?: string[] }) {
  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-2xl font-bold sm:text-3xl">{heading}</h2>
        <p className="mt-3 text-muted-foreground">{body}</p>
        {!!bullets?.length && (
          <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {bullets.map((b, i) => <li key={i} className="rounded-xl border border-white/10 bg-white/5 p-4">{b}</li>)}
          </ul>
        )}
      </div>
    </section>
  )
}
