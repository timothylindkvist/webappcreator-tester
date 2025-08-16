'use client';
import { Button, Card } from '../ui';

export default function Hero({ title, subtitle, cta }: { title: string; subtitle: string; cta: { label: string } }) {
  return (
    <section className="relative isolate overflow-hidden px-6 py-20 sm:py-28 md:py-32">
      <div className="absolute inset-0 -z-10 animate-float opacity-70">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full blur-3xl" style={{background: 'radial-gradient(closest-side, rgba(255,102,244,.6), transparent)'}}/>
        <div className="absolute -left-10 bottom-0 h-64 w-64 rounded-full blur-3xl" style={{background: 'radial-gradient(closest-side, rgba(75,115,255,.6), transparent)'}}/>
      </div>
      <div className="mx-auto max-w-3xl text-center">
        <p className="mb-4 inline-block rounded-full border border-border/60 px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground glass">
          Creator portfolio
        </p>
        <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl gradient-text">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
          {subtitle}
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button>{cta.label}</Button>
          <Button className="bg-accent text-accent-foreground">Contact</Button>
        </div>
        <Card className="mx-auto mt-10 max-w-3xl p-3 sm:p-4">
          <div className="grid grid-cols-3 gap-3 text-center text-sm text-muted-foreground">
            <div><span className="text-2xl font-bold text-foreground">1.2M</span><div>Followers</div></div>
            <div><span className="text-2xl font-bold text-foreground">320</span><div>Campaigns</div></div>
            <div><span className="text-2xl font-bold text-foreground">98%</span><div>Satisfaction</div></div>
          </div>
        </Card>
      </div>
    </section>
  );
}
