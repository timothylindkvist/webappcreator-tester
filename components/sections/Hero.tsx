import React from "react";

interface HeroProps {
  title?: string;
  subtitle?: string;
  cta?: { label: string };
  backgroundImage?: string;
}

export default function Hero({
  title,
  subtitle,
  cta,
  backgroundImage,
}: HeroProps) {
  return (
    <section
      className="relative isolate overflow-hidden px-6 py-20 sm:py-28 md:py-32 text-center"
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60 -z-10" />

      <div className="mx-auto max-w-3xl text-center text-white">
        {title && (
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl gradient-text">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/80 sm:text-lg">
            {subtitle}
          </p>
        )}
        {cta?.label && (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button className="rounded-2xl bg-[var(--brand)] text-white px-5 py-2.5 font-semibold shadow-md hover:opacity-90 transition-all">
              {cta.label}
            </button>
          </div>
        )}

        {/* Small metrics card */}
        <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-3 sm:p-4 text-sm text-white/80">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <span className="text-2xl font-bold text-white">1.2M</span>
              <div>Followers</div>
            </div>
            <div>
              <span className="text-2xl font-bold text-white">320</span>
              <div>Campaigns</div>
            </div>
            <div>
              <span className="text-2xl font-bold text-white">98%</span>
              <div>Satisfaction</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
