'use client';

interface CTAProps {
  title?: string;
  heading?: string;
  subtitle?: string;
  subheading?: string;
  button?: { label: string; href?: string };
  primary?: { label: string; href?: string };
}

export default function CTA({ title, heading, subtitle, subheading, button, primary }: CTAProps) {
  const btn = button ?? primary;
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold sm:text-4xl gradient-text">{title || heading}</h2>
        {(subtitle || subheading) && (
          <p className="mt-3 text-muted-foreground">{subtitle || subheading}</p>
        )}
        {btn?.label && (
          <div className="mt-6 flex justify-center">
            <button className="btn-primary">{btn.label}</button>
          </div>
        )}
      </div>
    </section>
  );
}
