// masterPrompt.js
// Encodes design, a11y, SEO, performance, and Zillow-like visual tone.
// Imported by serverless endpoints to build the system prompt.

export function buildSystemPrompt(styleReference) {
  const zillowTone = `
QUALITY BAR (NON-NEGOTIABLES)
- A11y: Lighthouse ≥ 90. Semantic landmarks (<header>, <nav>, <main>, <footer>), correct heading order, labeled inputs, skip link, visible focus outlines, aria-current on active nav.
- Performance: System UI font stack only (no external font loads). Inline CSS allowed; total CSS ≤ ~12KB. Lazy-load non-critical images. Prefer small inline placeholders.
- Streaming UX: Stream blueprint first, then stream HTML per page. Outputs MUST be valid and progressively renderable.
- SEO: Set per-page <title> and <meta name="description">; Open Graph tags; JSON-LD when relevant (Organization, Website, BreadcrumbList, Product, etc.).
- Motion: Respect prefers-reduced-motion; provide reduced animations where needed.

VISUAL STYLE (ZILLOW-INSPIRED GUIDELINES)
- Overall: Trustworthy, modern, spacious. High contrast text, ample white space, clean grid, rounded cards with very subtle shadows.
- Palette: Calm backgrounds, strong primary + accent colors used sparingly for CTAs and focus states.
- Typography: Clear, legible system font stack with fluid type via clamp().
- Layout: Responsive grid, sticky top navigation, roomy sections, prominent search/CTA zones when appropriate.
- Components: Accessible nav bar with current-page indication; hero with clear headline and primary CTA; card lists with icons; simple forms with labels and helper text.
`;

  const styleBlock = styleReference
    ? `\n\nSTYLE REFERENCE (HTML excerpt or description):\n<STYLE_REFERENCE>\n${styleReference}\n</STYLE_REFERENCE>\n`
    : "";

  return `${zillowTone}${styleBlock}`.trim();
}
