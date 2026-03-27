import React, { useEffect, useState } from 'react';

interface HeroProps {
  title?: string;
  subtitle?: string;
  cta?: { label: string; href?: string };
  backgroundImage?: string;
  metrics?: { value: string; label: string }[];
}

export default function Hero({ title, subtitle, cta, backgroundImage, metrics = [] }: HeroProps) {
  const [loaded, setLoaded] = useState(!backgroundImage);

  useEffect(() => {
    if (!backgroundImage) {
      setLoaded(true);
      return;
    }
    const img = new Image();
    img.src = backgroundImage;
    img.onload = () => setLoaded(true);
  }, [backgroundImage]);

  return (
    <section
      className={`relative isolate overflow-hidden rounded-3xl px-6 py-20 text-center transition-opacity duration-700 sm:py-28 md:py-32 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {backgroundImage ? <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/25 via-black/45 to-black/70" /> : null}

      <div className={`relative mx-auto max-w-3xl ${backgroundImage ? 'text-white' : 'text-[var(--foreground)]'}`}>
        {title ? <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl">{title}</h1> : null}
        {subtitle ? (
          <p className={`mx-auto mt-4 max-w-2xl text-base sm:text-lg ${backgroundImage ? 'text-white/85' : 'muted'}`}>
            {subtitle}
          </p>
        ) : null}

        {cta?.label ? (
          <div className="mt-8 flex items-center justify-center gap-3">
            {cta.href ? (
              <a href={cta.href} className="rounded-2xl bg-[var(--brand)] px-6 py-3 font-semibold text-white shadow-md transition-all hover:opacity-90">
                {cta.label}
              </a>
            ) : (
              <button className="rounded-2xl bg-[var(--brand)] px-6 py-3 font-semibold text-white shadow-md transition-all hover:opacity-90">
                {cta.label}
              </button>
            )}
          </div>
        ) : null}

        {metrics.length > 0 ? (
          <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-white/20 bg-white/10 p-3 text-sm shadow-lg backdrop-blur-sm sm:p-4">
            <div className="grid grid-cols-1 gap-3 text-center sm:grid-cols-3">
              {metrics.map((metric, index) => (
                <div key={`${metric.label}-${index}`}>
                  <span className="text-2xl font-bold text-white">{metric.value}</span>
                  <div>{metric.label}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
