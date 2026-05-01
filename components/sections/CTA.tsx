'use client';

import EditableText from '../EditableText';

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
  const displayTitle = title || heading;
  const titlePath = title !== undefined ? 'cta.title' : 'cta.heading';
  const displaySub = subtitle || subheading;
  const subPath = subtitle !== undefined ? 'cta.subtitle' : 'cta.subheading';
  const btnPath = button !== undefined ? 'cta.button.label' : 'cta.primary.label';

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-3xl text-center">
        {displayTitle && (
          <EditableText path={titlePath} value={displayTitle} tag="h2" className="text-3xl font-bold sm:text-4xl gradient-text" />
        )}
        {displaySub && (
          <EditableText path={subPath} value={displaySub} tag="p" className="mt-3 text-muted-foreground" />
        )}
        {btn?.label && (
          <div className="mt-6 flex justify-center">
            <EditableText path={btnPath} value={btn.label} tag="button" className="btn-primary" />
          </div>
        )}
      </div>
    </section>
  );
}
