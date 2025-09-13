import { Button } from '../ui';

export default function CTA({ heading, subheading, primary }: { heading: string; subheading: string; primary: { label: string } }) {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold sm:text-4xl gradient-text">{heading}</h2>
        <p className="mt-3 text-muted-foreground">{subheading}</p>
        <div className="mt-6 flex justify-center">
          <Button className="animate-pulse-glow">{primary.label}</Button>
        </div>
      </div>
    </section>
  );
}
