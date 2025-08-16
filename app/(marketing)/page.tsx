"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Star, Check, Play, Github, Wand2 } from "lucide-react";
import React, { useMemo, useState } from "react";

const Section = ({ className = "", children }: { className?: string; children: React.ReactNode }) => (
  <section className={`relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</section>
);

const GradientBG = () => (
  <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
    <div className="absolute left-1/2 top-0 h-[80rem] w-[80rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-fuchsia-500/20 via-indigo-500/15 to-cyan-400/10 blur-3xl" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,theme(colors.white/5)_1px,transparent_0)] [background-size:24px_24px] dark:bg-[radial-gradient(circle_at_1px_1px,theme(colors.white/3)_1px,transparent_0)] opacity-[0.15]" />
  </div>
);

const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 shadow-sm ring-1 ring-black/5 backdrop-blur">
    <Sparkles className="h-3.5 w-3.5" />
    {children}
  </span>
);

const PrimaryButton = ({ children }: { children: React.ReactNode }) => (
  <button className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_30px_rgb(79_70_229/35%)] transition-transform hover:scale-[1.02] active:scale-[0.99]">
    {children}
    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
  </button>
);

const GhostButton = ({ children }: { children: React.ReactNode }) => (
  <button className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/80 backdrop-blur transition hover:bg-white/10">
    {children}
  </button>
);

const FeatureCard = ({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.35 }}
    transition={{ duration: 0.5 }}
    className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-white/0 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl"
  >
    <div className="mb-3 inline-flex items-center justify-center rounded-2xl bg-white/10 p-2.5 text-white">
      <Icon className="h-5 w-5" />
    </div>
    <h3 className="mb-1.5 text-base font-semibold leading-tight text-white/90">{title}</h3>
    <p className="text-sm text-white/60">{desc}</p>
  </motion.div>
);

const CodePane = () => (
  <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-0 shadow-xl backdrop-blur-xl">
    <div className="flex items-center gap-2 border-b border-white/10 bg-white/5 px-4 py-2 text-xs text-white/60">
      <div className="flex gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
      </div>
      <span className="ml-2">app/page.tsx</span>
    </div>
    <pre className="scrollbar-thin m-0 max-h-[28rem] overflow-auto p-4 text-[12.5px] leading-relaxed text-white/80">
{`export default function Page(){
  return (
    <main className="min-h-dvh bg-background">
      <h1 className="text-4xl font-bold">Ship 10x faster</h1>
      <p className="text-white/70">Chat with AI to build your app.</p>
      <button className="rounded-xl bg-indigo-600 px-4 py-2 text-white">Get started</button>
    </main>
  )
}`}
    </pre>
  </div>
);

export default function Page() {
  const marquee = useMemo(() => ["Next.js","Tailwind","Framer Motion","Vercel","Supabase","GitHub","Stripe","OpenAI"], []);

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#0B0B0C] text-white antialiased">
      <GradientBG />

      <Section className="relative pt-16 pb-16 sm:pt-20 sm:pb-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 flex justify-center">
            <Badge>AI‑assisted website creator</Badge>
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto bg-gradient-to-b from-white to-white/60 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-6xl"
          >
            Build polished sites in hours, not weeks
          </motion.h1>
          <p className="mx-auto mt-4 max-w-2xl text-balance text-white/70 sm:text-lg">
            A Lovable-inspired, glassy UI kit you can deploy on Vercel. Clean spacing, gradients, and subtle motion out of the box.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <PrimaryButton>Get started</PrimaryButton>
            <GhostButton><Play className="h-4 w-4" /> Watch video</GhostButton>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:mt-16 lg:grid-cols-2">
          <CodePane />
          <div className="grid grid-cols-2 gap-4">
            <FeatureCard icon={Sparkles} title="Chat to build" desc="Describe features in natural language and scaffold them." />
            <FeatureCard icon={Wand2} title="Visual polish" desc="Glass surfaces, blurred gradients, consistent spacing." />
            <FeatureCard icon={Github} title="GitHub sync" desc="Works great with your repo and CI/CD." />
            <FeatureCard icon={Star} title="Accessible" desc="High contrast, keyboard-friendly controls." />
          </div>
        </div>
      </Section>

      <Section className="py-10">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <motion.div className="flex gap-10 whitespace-nowrap text-white/60" animate={{ x: [0, -400] }} transition={{ repeat: Infinity, duration: 18, ease: "linear" }}>
            {[...marquee, ...marquee].map((name, i) => (<span key={i} className="text-sm">{name}</span>))}
          </motion.div>
        </div>
      </Section>
    </main>
  );
}
