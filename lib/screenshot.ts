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

export async function captureElement(element: HTMLElement): Promise<string | null> {
  try {
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(element, {
      useCORS: true,
      scale: 0.5,
      height: 800,
      windowHeight: 800,
    });
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    if (dataUrl.length > 1_000_000) return null;
    return dataUrl;
  } catch (e) {
    console.error('Screenshot failed:', e);
    return null;
  }
}
