'use client';

interface Plan {
  name: string;
  price?: string;
  features?: string[];
  includes?: string[];
}

interface PricingProps {
  title?: string;
  heading?: string;
  plans?: Plan[];
}

export default function Pricing({ title, heading, plans = [] }: PricingProps) {
  return (
    <section className="px-6 py-12">
      <h2 className="text-2xl font-bold">{title || heading || 'Pricing'}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {plans.map((p, i) => {
          const items = p.features ?? p.includes ?? [];
          return (
            <div key={i} className="rounded-2xl border border-border/60 p-5">
              <div className="text-lg font-semibold">{p.name}</div>
              {p.price && <div className="mt-1 text-3xl font-extrabold gradient-text">{p.price}</div>}
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                {items.map((it, idx) => <li key={idx}>• {it}</li>)}
              </ul>
              <button className="btn-primary mt-4 w-full">Choose plan</button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
