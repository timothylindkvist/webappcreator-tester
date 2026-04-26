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

const card: React.CSSProperties = {
  border: '1px solid var(--border)',
  background: 'var(--card)',
  color: 'var(--card-foreground)',
};

const muted: React.CSSProperties = { color: 'var(--muted)' };

export default function Pricing({ title, heading, plans = [] }: PricingProps) {
  return (
    <section className="px-6 py-12" style={{ color: 'var(--foreground)' }}>
      <h2 className="text-2xl font-bold">{title || heading || 'Pricing'}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {plans.map((p, i) => {
          const items = p.features ?? p.includes ?? [];
          return (
            <div key={i} className="rounded-2xl p-5" style={card}>
              <div className="text-lg font-semibold">{p.name}</div>
              {p.price && (
                <div className="mt-1 text-3xl font-extrabold" style={{ color: 'var(--brand)' }}>
                  {p.price}
                </div>
              )}
              <ul className="mt-3 space-y-1 text-sm" style={muted}>
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
