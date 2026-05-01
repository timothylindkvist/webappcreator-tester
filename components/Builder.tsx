'use client';

import { type ComponentType } from 'react';
import About from './sections/About';
import AppDownload from './sections/AppDownload';
import CTA from './sections/CTA';
import FAQ from './sections/FAQ';
import Features from './sections/Features';
import Gallery from './sections/Gallery';
import Game from './sections/Game';
import Hero from './sections/Hero';
import Html from './sections/Html';
import NavBar from './sections/NavBar';
import Pricing from './sections/Pricing';
import Testimonials from './sections/Testimonials';
import { useBuilder } from './builder-context';

const SECTION_COMPONENTS: Record<string, ComponentType<any>> = {
  hero: Hero,
  about: About,
  features: Features,
  gallery: Gallery,
  testimonials: Testimonials,
  pricing: Pricing,
  faq: FAQ,
  cta: CTA,
  game: Game,
  html: Html,
  'app-download': AppDownload,
};

const KNOWN_KEYS = new Set(['theme', 'brand', 'media', 'blocks', 'hero', 'about', 'features', 'gallery', 'testimonials', 'pricing', 'faq', 'cta', 'game', 'history', 'html']);

export default function Builder() {
  const { data } = useBuilder();

  const blocks = Array.isArray(data.blocks) ? data.blocks : [];

  if (blocks.length > 0) {
    return (
      <>
        <NavBar />
        <div className="space-y-6 pb-8">
          {blocks.map((block) => {
            const Component = SECTION_COMPONENTS[block.type];
            if (Component) {
              const props = { ...(block.data || {}) };
              if (block.type === 'hero') {
                // Prefer pattern over legacy backgroundImage
                props.pattern = props.pattern || data.hero?.pattern;
                if (!props.pattern && data.media?.hero?.url) props.backgroundImage = data.media.hero.url;
              }
              if (block.type === 'html') {
                props.html = props.content || props.html || '';
              }
              return (
                <div key={block.id} id={block.id}>
                  <Component {...props} />
                </div>
              );
            }

            const value = block.data || {};
            const title = (value as any).title || (value as any).heading || block.type;
            const body = (value as any).body || (value as any).description || (value as any).text;
            const items = Array.isArray((value as any).items) ? (value as any).items : [];

            return (
              <div key={block.id} id={block.id}>
                <section className="card rounded-2xl p-6">
                  <h2 className="text-2xl font-semibold">{title}</h2>
                  {body ? <p className="mt-3 muted">{body}</p> : null}
                  {items.length > 0 ? (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {items.map((item: any, index: number) => (
                        <div key={index} className="rounded-xl border border-muted p-4">
                          <div className="font-medium">{item.title || item.name || `Item ${index + 1}`}</div>
                          {item.body || item.description ? <p className="muted mt-1">{item.body || item.description}</p> : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </section>
              </div>
            );
          })}
        </div>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <div className="space-y-6 pb-8">
        <div id="hero">
          <Hero {...data.hero} backgroundImage={data.media?.hero?.url || data.hero?.backgroundImage} pattern={data.hero?.pattern} />
        </div>
        {Object.entries(data).map(([key, value]) => {
          if (KNOWN_KEYS.has(key)) return null;
          if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
          const title = (value as any).title || (value as any).heading || key;
          const body = (value as any).body || (value as any).description || (value as any).text;
          return (
            <div key={key} id={key}>
              <section className="card rounded-2xl p-6">
                <h2 className="text-2xl font-semibold">{title}</h2>
                {body ? <p className="mt-3 muted">{body}</p> : null}
              </section>
            </div>
          );
        })}
      </div>
    </>
  );
}
