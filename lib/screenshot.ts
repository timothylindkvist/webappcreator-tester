export function needsScreenshot(message: string): boolean {
  const triggers = [
    'look like', 'similar to', 'match',
    'consistent', 'same as', 'that section',
    'those boxes', 'those cards', 'the cards',
    'make it', 'make them', 'like the',
    'as the', 'compared to', 'check the', 'look at',
  ];
  const lower = message.toLowerCase();
  return triggers.some((t) => lower.includes(t));
}

export function detectReferencedPage(
  message: string,
  pages: Array<{ id: string; name: string }>
): string | null {
  const lower = message.toLowerCase();
  for (const page of pages) {
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
