import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
      {/* Gradient overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60 -z-10"></div>

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
            <Button>{cta.label}</Button>
          </div>
        )}
        <Card className="mx-auto mt-10 max-w-3xl p-3 sm:p-4">
          <div className="grid grid-cols-3 gap-3 text-center text-sm text-muted-foreground">
            <div>
              <span className="text-2xl font-bold text-foreground">1.2M</span>
              <div>Followers</div>
            </div>
            <div>
              <span className="text-2xl font-bold text-foreground">320</span>
              <div>Campaigns</div>
            </div>
            <div>
              <span className="text-2xl font-bold text-foreground">98%</span>
              <div>Satisfaction</div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
