// Full inline script embedded in every custom-page HTML.
// Handles two jobs in one tag so there is no external file to load and no race:
//   1. Intercepts every anchor click → postMessage to preview parent (tab-switch)
//   2. Reads sm-nav-cfg JSON and injects a consistent navbar at top of body
export const NAV_INTERCEPT_SCRIPT = `(function(){
// 1. Click intercept — must run immediately, before any clicks
if(!window.__smNavActive){
window.__smNavActive=true;
document.addEventListener('click',function(e){
  var t=e.target;
  while(t&&t.tagName!=='A'){t=t.parentElement;}
  if(!t)return;
  var h=(t.getAttribute('href')||'').trim();
  // Strip leading ./ or / for relative paths
  h=h.replace(/^\\.\\//,'').replace(/^\\/(?!\\/)/,'');
  if(h.charAt(0)==='#'||/^(https?:|\/\/|mailto:|tel:)/.test(h))return;
  if(!h)h='index.html';
  e.preventDefault();e.stopPropagation();
  window.parent.postMessage({type:'sidesmith:navigate',href:h},'*');
},true);
}
// 2. Navbar injection — wait for DOM
function _smInjectNav(){
  var cfg=document.getElementById('sm-nav-cfg');
  if(!cfg)return;
  var d;try{d=JSON.parse(cfg.textContent);}catch(e){return;}
  var pages=d.pages||[];var cur=d.current||'';
  var cs=getComputedStyle(document.documentElement);
  var brand=cs.getPropertyValue('--brand').trim()||'#7c3aed';
  var bg=cs.getPropertyValue('--background').trim()||'#fff';
  var muted=cs.getPropertyValue('--muted').trim()||'#71717a';
  var border=cs.getPropertyValue('--border').trim()||'#e4e4e7';
  // Remove ALL existing nav elements before injecting ours
  var oldNavs=document.querySelectorAll('nav');
  for(var ni=oldNavs.length-1;ni>=0;ni--){var on=oldNavs[ni];if(on.parentNode)on.parentNode.removeChild(on);}
  // Remove "Navigation will be injected here" placeholder elements
  var allEls=document.querySelectorAll('*');
  for(var ei=0;ei<allEls.length;ei++){
    var el=allEls[ei];
    if(!el.children||!el.children.length){
      var txt=(el.textContent||'').toLowerCase().trim();
      if(txt.indexOf('navigation will be injected')===0||txt==='navigation placeholder'||txt==='[navigation]'){
        if(el.parentNode)el.parentNode.removeChild(el);
      }
    }
  }
  var nav=document.createElement('nav');
  nav.id='sm-nav';
  nav.setAttribute('style','position:sticky;top:0;z-index:999;background:'+bg+';border-bottom:1px solid '+border+';padding:0 1.25rem;display:flex;align-items:center;height:3.5rem;gap:1.5rem;font-family:inherit;');
  pages.forEach(function(p){
    var a=document.createElement('a');
    a.href=p.href;a.textContent=p.name;
    var active=(p.id===cur);
    a.setAttribute('style','text-decoration:none;font-size:.875rem;color:'+(active?brand:muted)+';font-weight:'+(active?'600':'400')+';cursor:pointer;');
    nav.appendChild(a);
  });
  var b=document.body;
  if(b.firstChild)b.insertBefore(nav,b.firstChild);else b.appendChild(nav);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',_smInjectNav);
else _smInjectNav();
})();`;

// Ensures the nav script is embedded inline in the HTML.
// Safe to call multiple times — __smNavActive guard prevents double-registration.
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
 *   <script>…inline nav script (intercept + injection)…</script>
 *
 * Everything is inline — no external file fetch, no race with srcdoc loading.
 * allPages must include home and all custom pages. currentPageId = this page.
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
    `<script>${NAV_INTERCEPT_SCRIPT}</script>`
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
 * After a Claude edit, restores the nav embed if Claude stripped it.
 * Always rebuilds with the inline script (upgrades old external-ref pages too).
 */
export function restoreNavEmbed(editedHtml: string, originalHtml: string): string {
  if (editedHtml.includes('sm-nav-cfg')) return editedHtml;
  // Extract config JSON from original
  const cfgMatch = originalHtml.match(
    /<script\s+id="sm-nav-cfg"\s+type="application\/json">([\s\S]*?)<\/script>/
  );
  if (!cfgMatch) return editedHtml;
  // Rebuild inline (never restore an old <script src="/nav.js"> reference)
  const inject =
    `<script id="sm-nav-cfg" type="application/json">${cfgMatch[1]}</script>\n` +
    `<script>${NAV_INTERCEPT_SCRIPT}</script>`;
  if (editedHtml.includes('</head>')) {
    return editedHtml.replace('</head>', inject + '\n</head>');
  }
  if (editedHtml.includes('<body')) {
    return editedHtml.replace('<body', inject + '\n<body');
  }
  return inject + '\n' + editedHtml;
}
