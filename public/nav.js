/* Shared nav injected into every custom page iframe.
   Reads page list from <script id="sm-nav-cfg" type="application/json">,
   removes any nav Claude generated, and injects a consistent styled navbar.
   Also handles postMessage intercept for the preview tab-switcher. */
(function () {
  'use strict';

  // ── 1. Set up click intercept immediately (before DOM is ready) ────────────
  // Intercepts every anchor click inside the iframe and postMessages the parent
  // so the preview tab-switcher can handle navigation without the iframe trying
  // to load an actual URL (which would cause "refused to connect" on Vercel).
  if (!window.__smNavActive) {
    window.__smNavActive = true;
    document.addEventListener('click', function (e) {
      var t = e.target;
      while (t && t.tagName !== 'A') t = t.parentElement;
      if (!t) return;
      var href = (t.getAttribute('href') || '').trim();
      if (!href || href.charAt(0) === '#' || /^(https?:|\/\/|mailto:|tel:)/.test(href)) return;
      e.preventDefault();
      e.stopPropagation();
      window.parent.postMessage({ type: 'sidesmith:navigate', href: href }, '*');
    }, true);
  }

  // ── 2. Inject navbar once DOM is ready ────────────────────────────────────
  function injectNav() {
    var cfgEl = document.getElementById('sm-nav-cfg');
    if (!cfgEl) return;

    var cfg;
    try { cfg = JSON.parse(cfgEl.textContent || '{}'); } catch (e) { return; }

    var pages   = Array.isArray(cfg.pages) ? cfg.pages : [];
    var current = typeof cfg.current === 'string' ? cfg.current : '';

    // Read design tokens set by the page's own <style> block
    var cs     = getComputedStyle(document.documentElement);
    var brand  = cs.getPropertyValue('--brand').trim()      || '#7c3aed';
    var bg     = cs.getPropertyValue('--background').trim() || '#ffffff';
    var muted  = cs.getPropertyValue('--muted').trim()      || '#71717a';
    var border = cs.getPropertyValue('--border').trim()     || '#e4e4e7';

    // Remove any <nav> Claude may have generated so we don't end up with two
    var old = document.querySelector('nav');
    if (old && old.parentNode) old.parentNode.removeChild(old);

    // Build the consistent navbar
    var nav = document.createElement('nav');
    nav.id = 'sm-nav';
    nav.setAttribute('style', [
      'position:sticky', 'top:0', 'z-index:999',
      'background:' + bg,
      'border-bottom:1px solid ' + border,
      'padding:0 1.25rem',
      'display:flex', 'align-items:center',
      'height:3.5rem', 'gap:1.5rem',
      'font-family:inherit'
    ].join(';'));

    pages.forEach(function (p) {
      var a = document.createElement('a');
      a.href     = p.href;   // e.g. "index.html" or "team.html"
      a.textContent = p.name;
      var active = (p.id === current);
      a.setAttribute('style', [
        'text-decoration:none',
        'font-size:.875rem',
        'transition:color .15s',
        'color:' + (active ? brand : muted),
        'font-weight:' + (active ? '600' : '400')
      ].join(';'));
      nav.appendChild(a);
    });

    // Prepend to body so it sits above page content
    if (document.body.firstChild) {
      document.body.insertBefore(nav, document.body.firstChild);
    } else {
      document.body.appendChild(nav);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectNav);
  } else {
    injectNav();
  }
})();
