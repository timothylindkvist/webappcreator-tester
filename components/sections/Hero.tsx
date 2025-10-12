import React, { useEffect, useState } from "react";

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
  // Fade-in effect when the image loads
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (backgroundImage) {
      const img = new Image();
      img.src = backgroundImage;
      img.onload = () => setLoaded(true);
    }
  }, [backgroundImage]);

  return (
    <section
      className={`relative isolate overflow-hidden px-6 py-20 sm:py-28 md:py-32 text-center transition-opacity duration-1000 ${
        loaded ? "opacity-100" : "opacity-0"
      }`}
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Cinematic overlay gradient */}
      {backgroundImage && (
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/30 via-black/40 to-black/70" />
      )}

      <div
        className={`relative mx-auto max-w-3xl text-center ${
          backgroundImage ? "text-white" : "text-black"
        }`}
      >
        {title && (
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            {title}
          </h1>
        )}

        {subtitle && (
          <p
            className={`mx-auto mt-4 max-w-2xl text-base sm:text-lg ${
              backgroundImage ? "text-white/85" : "text-gray-600"
            }`}
          >
            {subtitle}
          </p>
        )}

        {cta?.label && (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button className="rounded-2xl bg-[var(--brand)] text-white px-6 py-3 font-semibold shadow-md hover:opacity-90 transition-all">
              {cta.label}
            </button>
          </div>
        )}

        {/* Subtle stats card when a background exists */}
        {backgroundImage && (
          <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-3 sm:p-4 text-sm text-white/85 shadow-lg">
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
        )}
      </div>
    </section>
  );
}
