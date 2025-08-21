
'use client';
import { Button } from '../ui';
export default function Pricing({ heading, plans }: { heading: string; plans: { name: string; price: string; includes: string[] }[] }) {
  return (
    <section className="px-6 py-12">
      <h2 className="text-2xl font-bold">{heading}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {plans.map((p, i) => (
          <div key={i} className="rounded-2xl border border-border/60 p-5">
            <div className="text-lg font-semibold">{p.name}</div>
            <div className="mt-1 text-3xl font-extrabold gradient-text">{p.price}</div>
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              {p.includes.map((it, idx) => (<li key={idx}>• {it}</li>))}
            </ul>
            <Button className="mt-4 w-full">Choose plan</Button>
          </div>
        ))}
      </div>
    </section>
  );
}
