import Anthropic from '@anthropic-ai/sdk';
import { MODEL } from './models';

export type GeneratedPage = { html: string; pageId: string; pageName: string };

const PAGE_SECTION_GUIDES: Record<string, string> = {
  team: 'A hero with team intro heading, then a grid of team member cards (name, title, short bio, circular avatar placeholder), optionally a "Our values" row',
  about: 'Company story section, mission + values (3 cards), a timeline or milestones section, key stats row',
  contact: 'Contact form (name, email, message, submit button), contact details column (address, phone, email), a map placeholder div, social links',
  services: 'Services grid (4–6 cards: icon/title/description), "How it works" numbered steps, CTA banner',
  portfolio: 'Project grid (title, category, image placeholder, short description per project), case study cards',
  pricing: 'Three pricing tier cards (Free/Pro/Enterprise pattern), feature comparison list, FAQ accordion section',
  blog: 'Featured post hero, blog post grid (title, date, excerpt, read-more link), category filter',
  gallery: 'Photo grid with captions in a masonry or uniform grid layout',
  faq: 'FAQ accordion with 8–12 questions and answers, grouped by category',
};

function toPageId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'page';
}

export async function generatePage(
  client: Anthropic,
  params: {
    pageName: string;
    brief: string;
    designSystem: {
      colors: { brand?: string; accent?: string; background?: string; foreground?: string };
      brandName: string;
    };
    existingPages: { id: string; name: string }[];
    pageDescription?: string;
  }
): Promise<GeneratedPage> {
  const { pageName, brief, designSystem, existingPages, pageDescription = '' } = params;
  const { colors, brandName } = designSystem;
  const brand = colors.brand ?? '#7c3aed';
  const accent = colors.accent ?? '#06b6d4';
  const bg = colors.background ?? '#ffffff';
  const fg = colors.foreground ?? '#0b0f19';
  const pageId = toPageId(pageName);

  const isLight = (() => {
    const h = bg.replace('#', '');
    if (h.length !== 6) return true;
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.5;
  })();

  const card = isLight ? '#f4f4f5' : '#18181b';
  const border = isLight ? '#e4e4e7' : '#27272a';
  const muted = isLight ? '#71717a' : '#a1a1aa';

  // Build nav items: all existing pages + this new page
  const allPages = [...existingPages, { id: pageId, name: pageName }];
  const navItems = allPages
    .map((p) => {
      const href = p.id === 'home' ? '/' : `${p.id}.html`;
      const active = p.id === pageId;
      return `<li><a href="${href}" ${active ? 'class="active"' : ''}>${p.name}</a></li>`;
    })
    .join('\n        ');

  const sectionGuide =
    PAGE_SECTION_GUIDES[pageId] ??
    `Appropriate sections for a "${pageName}" page — use the brief for context${pageDescription ? `: ${pageDescription}` : ''}`;

  const typeGuide = pageId in PAGE_SECTION_GUIDES ? pageId : 'custom';

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 8192,
    system: `You are generating a complete HTML page for a multi-page website.
Return ONLY the HTML document — no markdown, no code fences, no explanation — starting with <!DOCTYPE html>.

DESIGN SYSTEM (use exactly these values):
  Brand name: ${brandName || 'Brand'}
  --brand: ${brand}
  --accent: ${accent}
  --background: ${bg}
  --foreground: ${fg}
  --card: ${card}
  --border: ${border}
  --muted: ${muted}

REQUIREMENTS:
1. Include a <style> block in <head> that sets these CSS custom properties on :root and uses them throughout
2. Navigation: <nav> containing <ul> with the exact items below — do not change the structure:
   ${navItems}
   Style the nav with the brand color. The .active link should be styled distinctly.
3. Page content sections: ${sectionGuide}
4. Footer: brand name + tagline + simple copyright line
5. Fonts: use system-ui or Google Fonts (one import line max) consistent with the brand vibe
6. Make it look polished and complete — real-sounding content based on the brief, not lorem ipsum for headings
7. Responsive: mobile-friendly with a hamburger or stacked nav on small screens

Write realistic copy that fits the business. Use the brand color for buttons, headings, and accent elements.`,
    messages: [
      {
        role: 'user',
        content: `Brief: ${brief}\n\nPage: ${pageName}${pageDescription ? `\nDetails: ${pageDescription}` : ''}`,
      },
    ],
  });

  const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : '';
  // Strip accidental markdown fences
  const html = raw.replace(/^```html?\n?/i, '').replace(/\n?```$/i, '').trim();

  if (!html.includes('<html') && !html.includes('<!DOCTYPE')) {
    throw new Error('Page generation returned invalid HTML');
  }

  return { html, pageId, pageName };
}
