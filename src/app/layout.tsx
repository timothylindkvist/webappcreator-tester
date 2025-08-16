import "@/styles/globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Universal Website Generator",
  description: "Tailored websites for any idea — powered by GPT‑5 (Vercel AI Gateway)",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-glam min-h-dvh antialiased">
        {children}
      </body>
    </html>
  );
}
