'use client';
import { useEffect } from 'react';

type Theme = {
  palette: {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    primary: string;
    primaryForeground: string;
    accent: string;
    accentForeground: string;
    border: string;
    input: string;
    ring: string;
  };
};

export default function ThemeApplier({ theme }: { theme: Theme | null }) {
  useEffect(() => {
    if (!theme) return;
    const r = document.documentElement;
    const p = theme.palette;
    r.style.setProperty('--background', p.background);
    r.style.setProperty('--foreground', p.foreground);
    r.style.setProperty('--card', p.card);
    r.style.setProperty('--card-foreground', p.cardForeground);
    r.style.setProperty('--primary', p.primary);
    r.style.setProperty('--primary-foreground', p.primaryForeground);
    r.style.setProperty('--accent', p.accent);
    r.style.setProperty('--accent-foreground', p.accentForeground);
    r.style.setProperty('--border', p.border);
    r.style.setProperty('--input', p.input);
    r.style.setProperty('--ring', p.ring);
  }, [theme]);
  return null;
}
