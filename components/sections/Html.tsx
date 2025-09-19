import React from 'react';

export default function HtmlSection({ html = '' }: { html?: string }) {
  return (
    <section className="py-12 sm:py-16">
      <div className="container mx-auto px-4 prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  );
}