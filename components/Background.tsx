
'use client';
import React from 'react';
import { useBuilder } from './builder-context';

type BGConf = {
  style: 'mesh' | 'radial-glow' | 'shapes';
  colors: string[];
};

export default function Background() {
  const { data } = useBuilder();
  const bg: BGConf | undefined = (data as any)?.theme?.background;

  // No fallbacks: if API didn't provide background, render nothing.
  if (!bg || !bg.style || !Array.isArray(bg.colors)) {
    return null;
  }

  const colors = bg.colors.length ? bg.colors : [];

  if (bg.style === 'mesh') {
    const layers = colors.slice(0, 4).map((c, i) => (
      <div
        key={i}
        className="pointer-events-none absolute inset-0 blur-3xl opacity-40"
        style={{
          background: `radial-gradient(600px 600px at ${20 + i*25}% ${30 + (i%2)*30}%, ${c}, transparent 70%)`,
          mixBlendMode: 'screen',
        }}
      />
    ));
    return <div aria-hidden className="fixed inset-0 -z-10">{layers}</div>;
  }

  if (bg.style === 'radial-glow') {
    return (
      <div aria-hidden className="fixed inset-0 -z-10">
        {(colors[0] || colors[1]) ? <div className="absolute inset-0" style={{background:`radial-gradient(1200px 800px at 50% 10%, ${(colors[0]||colors[1])}22, transparent 60%)`}}/> : null}
        {colors[1] ? <div className="absolute inset-0" style={{background:`radial-gradient(900px 700px at 10% 80%, ${colors[1]}22, transparent 60%)`}}/> : null}
        {colors[2] ? <div className="absolute inset-0" style={{background:`radial-gradient(900px 700px at 90% 70%, ${colors[2]}22, transparent 60%)`}}/> : null}
      </div>
    );
  }

  // shapes
  const circles = colors.slice(0, 6).map((c, i) => {
    const size = 160 + i*40;
    const l = 10 + (i*15)%80;
    const t = 15 + (i*18)%70;
    const op = 0.06 + (i%3)*0.04;
    return (
      <div key={i} className="pointer-events-none absolute rounded-full blur-2xl"
        style={{ width:size, height:size, left:`${l}%`, top:`${t}%`, transform:'translate(-50%,-50%)', background: c, opacity: op}}/>
    );
  });

  return <div aria-hidden className="fixed inset-0 -z-10">{circles}</div>;
}
