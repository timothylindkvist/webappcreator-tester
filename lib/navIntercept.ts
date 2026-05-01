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
export function ensureNavScript(html: string): string {
  if (html.includes('__smNavActive')) return html;
  const tag = `<script>${NAV_INTERCEPT_SCRIPT}</script>`;
  return html.includes('</body>')
    ? html.replace(/<\/body>/i, `${tag}</body>`)
    : html + tag;
}
