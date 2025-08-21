
'use client'
export default function Pricing({ heading = 'Pricing', plans = [] as { name: string; price?: string; features?: string[] }[] }:
  { heading?: string; plans?: { name: string; price?: string; features?: string[] }[] }) {
  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-2xl font-bold sm:text-3xl">{heading}</h2>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((p, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="font-semibold">{p.name}</div>
              {p.price && <div className="text-2xl font-extrabold mt-2">{p.price}</div>}
              <ul className="text-sm text-muted-foreground list-disc ml-5 mt-2">{(p.features || []).map((f, j) => <li key={j}>{f}</li>)}</ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
