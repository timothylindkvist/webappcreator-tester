// NAV_INTERCEPT_SCRIPT — injected into every custom-page iframe (and embedded
// inline in the HTML itself) so in-page nav links send a postMessage to the
// parent rather than navigating the iframe to a real URL.
export const NAV_INTERCEPT_SCRIPT = `(function(){
if(window.__smNavActive)return;
window.__smNavActive=true;
document.addEventListener('click',function(e){
  var t=e.target;
  while(t&&t.tagName!=='A'){t=t.parentElement;}
  if(!t)return;
  var href=(t.getAttribute('href')||'').trim();
  if(!href||href.charAt(0)==='#'||/^(https?:|\/\/|mailto:|tel:)/.test(href))return;
  e.preventDefault();
  e.stopPropagation();
  window.parent.postMessage({type:'sidesmith:navigate',href:href},'*');
},true);
})();`;

// Ensures NAV_INTERCEPT_SCRIPT is embedded in the HTML. Safe to call multiple
// times — the __smNavActive guard in the script prevents double-registration.
// Used as a belt-and-suspenders fallback for pages that may not load nav.js.
export function ensureNavScript(html: string): string {
  if (html.includes('__smNavActive')) return html;
  const tag = `<script>${NAV_INTERCEPT_SCRIPT}</script>`;
  return html.includes('</body>')
    ? html.replace(/<\/body>/i, `${tag}</body>`)
    : html + tag;
}

// ── Shared nav.js helpers ─────────────────────────────────────────────────────

type NavPage = { id: string; name: string; href: string };
type NavConfig = { pages: NavPage[]; current: string };

function toHref(pageId: string): string {
  return pageId === 'home' ? 'index.html' : `${pageId}.html`;
}

/**
 * Builds the two tags that go inside <head> of every generated custom page:
 *   <script id="sm-nav-cfg" type="application/json">…config JSON…</script>
 *   <script src="/nav.js"></script>
 *
 * allPages must include the home page and all custom pages (including the
 * page being generated). currentPageId is the id of the page being built.
 */
export function buildNavEmbed(
  allPages: Array<{ id: string; name: string }>,
  currentPageId: string
): string {
  const pages: NavPage[] = allPages.map((p) => ({
    id: p.id,
    name: p.name,
    href: toHref(p.id),
  }));
  const cfg: NavConfig = { pages, current: currentPageId };
  return (
    `<script id="sm-nav-cfg" type="application/json">${JSON.stringify(cfg)}</script>\n` +
    `<script src="/nav.js"></script>`
  );
}

/**
 * Updates the sm-nav-cfg JSON in an existing page's HTML to add a newly
 * created page. No-op if the config tag is absent (old-style page).
 */
export function updateNavConfig(
  html: string,
  newPage: { id: string; name: string }
): string {
  return html.replace(
    /(<script\s+id="sm-nav-cfg"\s+type="application\/json">)([\s\S]*?)(<\/script>)/,
    (_all, open, body, close) => {
      try {
        const cfg: NavConfig = JSON.parse(body);
        const pages = cfg.pages ?? [];
        if (!pages.some((p) => p.id === newPage.id)) {
          pages.push({ id: newPage.id, name: newPage.name, href: toHref(newPage.id) });
          cfg.pages = pages;
        }
        return open + JSON.stringify(cfg) + close;
      } catch {
        return _all;
      }
    }
  );
}

/**
 * After a Claude edit, restores the sm-nav-cfg tag + nav.js reference if
 * Claude removed them. Uses the original HTML as the source of truth.
 */
export function restoreNavEmbed(editedHtml: string, originalHtml: string): string {
  if (editedHtml.includes('sm-nav-cfg')) return editedHtml;
  const cfgMatch = originalHtml.match(
    /<script\s+id="sm-nav-cfg"\s+type="application\/json">[\s\S]*?<\/script>/
  );
  if (!cfgMatch) return editedHtml;
  const navJsTag = '<script src="/nav.js"></script>';
  const inject = cfgMatch[0] + '\n' + navJsTag;
  if (editedHtml.includes('</head>')) {
    return editedHtml.replace('</head>', inject + '\n</head>');
  }
  if (editedHtml.includes('<body')) {
    return editedHtml.replace('<body', inject + '\n<body');
  }
  return inject + '\n' + editedHtml;
}
