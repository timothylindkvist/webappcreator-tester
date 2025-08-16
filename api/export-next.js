function safeName(input) {
  return String(input || "site")
    .toLowerCase()
    .replace(/[^a-z0-9\-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "site";
}

function normalizePages(pages) {
  if (!Array.isArray(pages)) return [ { path: "/", purpose: "landing", sections: [] } ];
  const seen = new Set();
  const result = [];
  for (const p of pages) {
    let path = (p?.path || "/").trim();
    if (!path.startsWith("/")) path = "/" + path;
    if (path !== "/" && path.endsWith("/")) path = path.slice(0, -1);
    if (seen.has(path)) continue;
    seen.add(path);
    result.push({ path, purpose: p?.purpose || "page", sections: Array.isArray(p?.sections) ? p.sections : [] });
  }
  if (!seen.has("/")) result.unshift({ path: "/", purpose: "landing", sections: [] });
  return result;
}

function reactifyPath(routePath) {
  if (routePath === "/") return "page";
  const segs = routePath.split("/").filter(Boolean);
  return segs.join("/") + "/page";
}

function pageComponentTSX({ title, metaDesc, nav, currentPath, sections }) {
  const heading = (sections || []).find(s => s?.heading)?.heading || title || "Untitled";
  const navLinks = (nav || []).map(n => {
    const href = n.href || "/";
    const label = n.label || href;
    const isCurrent = href === currentPath;
    return `<a href=\"${href}\" aria-current=\"${isCurrent ? "page" : ""}\" className=\"px-3 py-1.5 rounded-md border hover:bg-accent hover:text-accent-foreground ${isCurrent ? "bg-accent text-accent-foreground" : ""}\">${label}</a>`;
  }).join("");

  const sectionHTML = (sections || []).map((s, i) => {
    if (s.type === "features") {
      const cards = (s.items || []).map(item => `<div className=\"rounded-lg border bg-card p-6 shadow-sm\">
        <h3 className=\"font-semibold mb-1\">${item.title || "Feature"}</h3>
        <p className=\"text-sm text-muted-foreground\">${item.desc || ""}</p>
      </div>`).join("");
      return `<section className=\"grid gap-4 sm:grid-cols-2 lg:grid-cols-3\">${cards}</section>`;
    }
    if (s.type === "hero") {
      return `<section className=\"relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary/15 via-accent/10 to-transparent p-10\">
        <div className=\"max-w-2xl\">
          <h2 className=\"text-3xl md:text-5xl font-bold tracking-tight mb-3\">${s.title || "Welcome"}</h2>
          <p className=\"text-muted-foreground mb-6\">${s.subtitle || ""}</p>
          <div className=\"flex gap-3\">
            <a href=\"${s.ctaHref || "#"}\" className=\"inline-flex items-center justify-center rounded-md border bg-primary text-primary-foreground px-4 py-2 font-medium\">${s.ctaLabel || "Get started"}</a>
            ${s.secondaryHref ? `<a href=\"${s.secondaryHref}\" className=\"inline-flex items-center justify-center rounded-md border px-4 py-2\">${s.secondaryLabel || "Learn more"}</a>` : ""}
          </div>
        </div>
      </section>`;
    }
    return `<section className=\"rounded-xl border bg-card shadow-sm p-6\"><div className=\"text-muted-foreground\">Section ${i+1}</div></section>`;
  }).join("\n");

  return `
export const metadata = {
  title: ${JSON.stringify(title || "Page")},
  description: ${JSON.stringify(metaDesc || "")}
};

export default function Page() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50">Skip to content</a>
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav className="mx-auto max-w-6xl flex items-center gap-2 px-4 py-2">
          <div className="font-semibold tracking-tight">${(title || "Site")}</div>
          <div className="ml-auto flex items-center gap-1">
            ${navLinks}
          </div>
        </nav>
      </header>

      <div id="content" className="mx-auto max-w-6xl px-4 py-10 grid gap-8">
        <section className="rounded-xl border bg-card text-card-foreground shadow-sm p-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">${heading}</h1>
          <p className="text-muted-foreground">This page was generated from your blueprint. Customize sections as needed.</p>
        </section>

        {/* Sections */}
        <div dangerouslySetInnerHTML={{__html: ${JSON.stringify(sectionHTML)}}} />
      </div>

      <footer className="mt-10 border-t py-6 text-center text-sm text-muted-foreground">
        © ${(new Date()).getFullYear()} ${(title || "Site")}. All rights reserved.
      </footer>
    </main>
  );
}
`;
}

function globalsCSS({ palette }) {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

:root{
  --background: ${palette?.bg || "210 40% 98%"};
  --foreground: ${palette?.text || "222.2 84% 4.9%"};
  --card: ${palette?.bg || "0 0% 100%"};
  --card-foreground: ${palette?.text || "222.2 84% 4.9%"};
  --popover: ${palette?.bg || "0 0% 100%"};
  --popover-foreground: ${palette?.text || "222.2 84% 4.9%"};
  --primary: ${palette?.primary || "221.2 83.2% 53.3%"};
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: ${palette?.accent || "217.2 91.2% 59.8%"};
  --accent-foreground: 210 40% 98%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: ${palette?.primary || "221.2 83.2% 53.3%"};
  --radius: 0.75rem;
}

.dark{
  --background: 222 47% 5%;
  --foreground: 210 40% 98%;
  --card: 222 47% 7%;
  --card-foreground: 210 40% 98%;
  --popover: 222 47% 7%;
  --popover-foreground: 210 40% 98%;
  --primary: ${palette?.primary || "217.2 91.2% 59.8%"};
  --primary-foreground: 222.2 47.4% 11.2%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20% 65%;
  --accent: ${palette?.accent || "221.2 83.2% 53.3%"};
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: ${palette?.primary || "217.2 91.2% 59.8%"};
}

@layer base{
  *{ @apply border-border; }
  body{ @apply bg-background text-foreground antialiased; }
}
`;
}

function tailwindConfig() {
  return `import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx,js,jsx}",
    "./components/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;
`;
}

function layoutTSX({ siteTitle }) {
  return `import "./globals.css";

export const metadata = {
  title: ${JSON.stringify(siteTitle || "Site")},
  description: "Generated by your Real-Time Website Generator",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
`;
}

function nextConfig() {
  return `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { appDir: true },
};

export default nextConfig;
`;
}

function tsconfig() {
  return `{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "types": ["node"]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
`;
}

function packageJSON({ name }) {
  return JSON.stringify({
    name: name || "next-export-site",
    private: true,
    type: "module",
    scripts: {
      dev: "next dev",
      build: "next build",
      start: "next start",
      lint: "next lint"
    },
    dependencies: {
      "next": "14.2.5",
      "react": "18.3.1",
      "react-dom": "18.3.1",
      "tailwindcss": "^3.4.10",
      "autoprefixer": "^10.4.20",
      "postcss": "^8.4.45"
    },
    devDependencies: {
      "typescript": "^5.5.4"
    }
  }, null, 2);
}

function postcssConfig() {
  return `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};`;
}

function readme({ title }) {
  return `# ${title || "Generated Site"}

This is a Next.js (App Router) project generated from your blueprint.

## Scripts
- \`npm run dev\`
- \`npm run build\`
- \`npm start\`

## Stack
- Next.js App Router
- Tailwind CSS (with CSS variables themed from the blueprint)
`;
}

export const config = { runtime: "nodejs18.x" };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).send("Export error (405): POST only");
    return;
  }
  try {
    const { blueprint } = req.body || {};
    const site = blueprint?.site || {};
    const pages = normalizePages(site.pages || []);
    const nav = Array.isArray(site.navigation) && site.navigation.length ? site.navigation : pages.map(p => ({ label: p.path === "/" ? "Home" : p.path.replace("/", "").replace("-", " ").replace(/\b\w/g, m=>m.toUpperCase()), href: p.path }));
    const palette = site?.brand?.palette || {};
    const siteTitle = site?.title || "Site";
    const metaDesc = site?.seo?.metaDescription || "";

    const JSZip = require("jszip");
    const zip = new JSZip();

    // root files
    zip.file("package.json", packageJSON({ name: safeName(siteTitle) }));
    zip.file("next.config.mjs", nextConfig());
    zip.file("postcss.config.js", postcssConfig());
    zip.file("tailwind.config.ts", tailwindConfig());
    zip.file("tsconfig.json", tsconfig());
    zip.file("README.md", readme({ title: siteTitle }));
    zip.file("next-env.d.ts", "/// <reference types=\"next\" />\n/// <reference types=\"next/image-types/global\" />\n");

    // app/
    zip.file("app/layout.tsx", layoutTSX({ siteTitle }));
    zip.file("app/globals.css", globalsCSS({ palette }));

    // pages
    for (const p of pages) {
      const file = reactifyPath(p.path) + ".tsx";
      const html = pageComponentTSX({
        title: siteTitle,
        metaDesc,
        nav,
        currentPath: p.path,
        sections: Array.isArray(p.sections) ? p.sections : []
      });
      zip.file(`app/(site)/${file}`, html);
    }

    // public assets
    zip.file("public/robots.txt", "User-agent: *\nAllow: /\n");
    zip.file("public/sitemap.txt", pages.map(p => p.path).join("\n"));

    const content = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

    res.status(200);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${safeName(siteTitle) || "site"}.zip"`);
    res.send(content);
  } catch (err) {
    res.status(500).send(`Export error (500): ${String(err)}`);
  }
}
