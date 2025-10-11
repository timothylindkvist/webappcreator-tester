'use client';
import React from 'react';
import { useBuilder } from './builder-context';

type BGConf = {
  style: 'mesh' | 'radial-glow' | 'shapes' | 'energy' | 'gradient-scene';
  palette: string[];
  intensity: 'soft' | 'balanced' | 'vivid';
  blendMode?: 'screen' | 'overlay' | 'lighten' | 'normal';
  particleField?: boolean;
};

function alphaHex(opacity: number) {
  const v = Math.max(0, Math.min(255, Math.round(opacity * 255)));
  return v.toString(16).padStart(2, '0');
}

export default function Background() {
  const { data } = useBuilder();
  const bg: BGConf | undefined = (data as any)?.theme?.background;
  if (!bg || !bg.style || !Array.isArray(bg.palette) || bg.palette.length === 0) return null;

  const colors = bg.palette.slice(0, 5);
  const blend = bg.blendMode || 'screen';
  const alphaBase = bg.intensity === 'vivid' ? 0.30 : bg.intensity === 'balanced' ? 0.22 : 0.14;
  const blurPx = bg.intensity === 'vivid' ? 36 : bg.intensity === 'balanced' ? 44 : 56;

  const Mesh = () => (
    <div className="fixed inset-0 -z-10">
      {colors[0] && <div className="absolute inset-0 pointer-events-none" style={{background:`radial-gradient(700px 700px at 20% 25%, ${colors[0]}${alphaHex(alphaBase)}, transparent 70%)`, mixBlendMode:blend, filter:`blur(${blurPx}px)`}}/>}
      {colors[1] && <div className="absolute inset-0 pointer-events-none" style={{background:`radial-gradient(700px 700px at 80% 30%, ${colors[1]}${alphaHex(alphaBase)}, transparent 70%)`, mixBlendMode:blend, filter:`blur(${blurPx}px)`}}/>}
      {colors[2] && <div className="absolute inset-0 pointer-events-none" style={{background:`radial-gradient(700px 700px at 25% 80%, ${colors[2]}${alphaHex(alphaBase)}, transparent 70%)`, mixBlendMode:blend, filter:`blur(${blurPx}px)`}}/>}
      {colors[3] && <div className="absolute inset-0 pointer-events-none" style={{background:`radial-gradient(700px 700px at 85% 75%, ${colors[3]}${alphaHex(alphaBase)}, transparent 70%)`, mixBlendMode:blend, filter:`blur(${blurPx}px)`}}/>}
      <div className="absolute inset-0" style={{background:`linear-gradient(120deg, ${colors[0]||'#000'}11, ${colors[2]||'#000'}11)`}}/>
    </div>
  );

  const RadialGlow = () => (
    <div className="fixed inset-0 -z-10">
      <div className="absolute inset-0" style={{background:`radial-gradient(1200px 900px at 50% 10%, ${colors[0]||'#fff'}${alphaHex(alphaBase)}, transparent 60%)`, mixBlendMode:blend, filter:`blur(${blurPx}px)`}}/>
      <div className="absolute inset-0" style={{background:`radial-gradient(900px 700px at 10% 80%, ${colors[1]||'#fff'}${alphaHex(alphaBase)}, transparent 60%)`, mixBlendMode:blend, filter:`blur(${blurPx}px)`}}/>
      <div className="absolute inset-0" style={{background:`radial-gradient(900px 700px at 90% 70%, ${colors[2]||'#fff'}${alphaHex(alphaBase)}, transparent 60%)`, mixBlendMode:blend, filter:`blur(${blurPx}px)`}}/>
    </div>
  );

  const Shapes = () => (
    <div className="fixed inset-0 -z-10">
      {colors.slice(0,6).map((c, i) => {
        const size = 180 + i*60;
        const left = [15,85,25,75,50,60][i%6];
        const top = [20,25,75,70,50,35][i%6];
        const opacity = Math.max(0.05, alphaBase * (0.9 - i*0.1));
        return (
          <div key={i} className="absolute rounded-full blur-3xl pointer-events-none"
            style={{ width:size, height:size, left:`${left}%`, top:`${top}%`, transform:'translate(-50%,-50%)', background:c, opacity, mixBlendMode:blend }}
          />
        );
      })}
    </div>
  );

  const Energy = () => (
    <div className="fixed inset-0 -z-10">
      <div className="absolute inset-0" style={{background:`conic-gradient(from 210deg at 60% 40%, ${colors[0]||'#fff'}${alphaHex(alphaBase)}, ${colors[1]||'#fff'}${alphaHex(alphaBase)}, ${colors[2]||'#fff'}${alphaHex(alphaBase)})`, mixBlendMode:blend, filter:`blur(${blurPx}px)`}}/>
      <div className="absolute inset-0" style={{background:`radial-gradient(800px 600px at 30% 30%, ${colors[3]||colors[0]||'#fff'}${alphaHex(alphaBase)}, transparent 70%)`, mixBlendMode:blend, filter:`blur(${blurPx}px)`}}/>
    </div>
  );

  const GradientScene = () => (
    <div className="fixed inset-0 -z-10" style={{background:`linear-gradient(135deg, ${colors[0]||'#0f172a'} 0%, ${colors[1]||'#111827'} 35%, ${colors[2]||'#0b1220'} 100%)`}}>
      <div className="absolute inset-0" style={{background:`radial-gradient(900px 700px at 15% 25%, ${colors[3]||colors[1]||'#fff'}${alphaHex(alphaBase)}, transparent 60%)`, mixBlendMode:blend, filter:`blur(${blurPx}px)`}}/>
      <div className="absolute inset-0" style={{background:`radial-gradient(1000px 800px at 85% 75%, ${colors[4]||colors[0]||'#fff'}${alphaHex(alphaBase)}, transparent 60%)`, mixBlendMode:blend, filter:`blur(${blurPx}px)`}}/>
    </div>
  );

  const Particles = () => {
    if (!bg.particleField) return null;
    const items = Array.from({length: 36}).map((_, i) => {
      const delay = (i % 12) * 0.8;
      const dur = 10 + (i % 8);
      const size = 2 + (i % 3);
      const left = (i*29) % 100;
      const top = (i*53) % 100;
      const opacity = 0.08 + (i % 5)*0.02;
      return (
        <div key={i} className="absolute rounded-full bg-white"
          style={{ width:size, height:size, left:`${left}%`, top:`${top}%`, opacity,
            filter:'blur(0.5px)', animation:`floatY ${dur}s ease-in-out ${delay}s infinite alternate` }}/>
      );
    });
    return <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">{items}</div>;
  };

  return (
    <>
      {/* Hero image layer (behind gradients) */}
      { (data as any)?.media?.hero?.url ? (
        <div className="fixed inset-0 -z-20">
          <img src={(data as any).media.hero.url} alt="hero" className="w-full h-full object-cover opacity-60"/>
          <div className="absolute inset-0 bg-black/20"/>
        </div>
      ) : null }
      <style jsx global>{`
        @keyframes floatY { from { transform: translateY(-6px); } to { transform: translateY(6px); } }
      `}</style>
      {bg.style === 'mesh' && <Mesh />}
      {bg.style === 'radial-glow' && <RadialGlow />}
      {bg.style === 'shapes' && <Shapes />}
      {bg.style === 'energy' && <Energy />}
      {bg.style === 'gradient-scene' && <GradientScene />}
      <Particles />
    </>
  );
}
