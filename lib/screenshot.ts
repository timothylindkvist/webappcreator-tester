export function needsScreenshot(message: string): boolean {
  const triggers = [
    'look like', 'similar to', 'match',
    'consistent', 'same as', 'same theme', 'same style', 'same design', 'same look',
    'that section', 'those boxes', 'those cards', 'the cards',
    'make it', 'make them', 'like the',
    'as the', 'compared to', 'check the', 'look at',
  ];
  const lower = message.toLowerCase();
  return triggers.some((t) => lower.includes(t));
}

// Detects which page the user intends to EDIT (the target of the change).
// Used to override activePage routing when the user is on page A but says
// "make the home page look like the team page" — target is 'home', not 'team'.
export function detectTargetPage(
  message: string,
  pages: Array<{ id: string; name: string }>
): string | null {
  const lower = message.toLowerCase();
  const allPages = [{ id: 'home', name: 'Home' }, ...pages];
  const actions = [
    'make', 'update', 'change', 'edit', 'fix', 'adjust',
    'redesign', 'restyle', 'style', 'align', 'modify', 'format', 'improve',
    'add', 'insert', 'put', 'place', 'include', 'append', 'remove', 'delete',
  ];
  for (const page of allPages) {
    if (!page.id || !page.name) continue;
    const name = page.name.toLowerCase();
    const id = page.id.toLowerCase();
    for (const action of actions) {
      if (
        lower.includes(`${action} the ${name} page`) ||
        lower.includes(`${action} ${name} page`) ||
        lower.includes(`${action} the ${id} page`) ||
        lower.includes(`${action} ${id} page`)
      ) {
        return page.id;
      }
    }
    if (
      lower.includes(`the ${name} page should`) ||
      lower.includes(`the ${name} page needs`) ||
      lower.includes(`on the ${name} page`) ||
      lower.includes(`to the ${name} page`) ||
      lower.includes(`for the ${name} page`) ||
      lower.includes(`in the ${name} page`) ||
      lower.includes(`into the ${name} page`) ||
      lower.includes(`the ${id} page should`) ||
      lower.includes(`the ${id} page needs`) ||
      lower.includes(`on the ${id} page`) ||
      lower.includes(`to the ${id} page`) ||
      lower.includes(`for the ${id} page`) ||
      lower.includes(`in the ${id} page`) ||
      lower.includes(`into the ${id} page`)
    ) {
      return page.id;
    }
  }
  return null;
}

// Detects when the user wants a change applied to every page on the site.
export function detectSiteWideChange(message: string): boolean {
  return /\bacross\s+(?:the\s+)?(?:whole\s+)?(?:website|site|all\s+pages?)\b|\ball\s+pages?\b|\bevery\s+page\b|\bthroughout\s+(?:the\s+)?(?:site|website)\b|\bsite[\s-]?wide\b|\bon\s+all\s+pages?\b/i.test(message);
}

export function detectReferencedPage(
  message: string,
  pages: Array<{ id: string; name: string }>
): string | null {
  const lower = message.toLowerCase();
  for (const page of pages) {
    if (!page.id || !page.name) continue;
    const pageName = page.name.toLowerCase();
    const pageId = page.id.toLowerCase();
    if (
      lower.includes(`${pageName} page`) ||
      lower.includes(`the ${pageName}`) ||
      lower.includes(`like ${pageName}`) ||
      lower.includes(`as ${pageName}`) ||
      lower.includes(pageId)
    ) {
      return page.id;
    }
  }
  return null;
}

// Captures a DOM element already in the main document (use for home page).
// Cross-origin images are skipped (blank) but layout, colours, and text are preserved.
export async function captureElement(element: HTMLElement): Promise<string | null> {
  try {
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(element, {
      useCORS: false,
      allowTaint: false,
      scale: 0.5,
      height: 800,
      windowHeight: 800,
      logging: false,
    });
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    if (dataUrl.length > 1_000_000) return null;
    return dataUrl;
  } catch (e) {
    console.error('Screenshot failed:', e);
    return null;
  }
}

// Renders an HTML string in a temporary off-screen iframe (no sandbox, so
// contentDocument is accessible) and captures it with html2canvas.
// Use this for pages whose HTML source is available (all non-home pages).
export function capturePageHtml(html: string): Promise<string | null> {
  return new Promise((resolve) => {
    let done = false;
    const finish = (result: string | null) => {
      if (done) return;
      done = true;
      try { document.body.removeChild(iframe); } catch {}
      resolve(result);
    };

    const iframe = document.createElement('iframe');
    // Off-screen, fixed size for consistent rendering
    iframe.style.cssText =
      'position:fixed;top:-10000px;left:-10000px;width:1280px;height:800px;border:none;opacity:0;pointer-events:none;';

    const capture = async () => {
      try {
        const body = iframe.contentDocument?.body;
        if (!body) { finish(null); return; }

        const { default: html2canvas } = await import('html2canvas');
        const canvas = await html2canvas(body, {
          useCORS: false,
          allowTaint: false,
          scale: 0.5,
          height: 800,
          windowHeight: 800,
          logging: false,
        });
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        finish(dataUrl.length > 1_000_000 ? null : dataUrl);
      } catch (e) {
        console.error('capturePageHtml failed:', e);
        finish(null);
      }
    };

    iframe.onload = capture;
    // Fallback: fire if onload hasn't triggered after 1.5 s
    setTimeout(() => { if (!done) capture(); }, 1500);

    iframe.srcdoc = html;
    document.body.appendChild(iframe);
  });
}
