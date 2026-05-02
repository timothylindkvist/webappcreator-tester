import puppeteer, { type Page, type ElementHandle } from 'puppeteer-core';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// ── Section detection ─────────────────────────────────────────────────────────

// Pattern 1: "the X section / area / block / region / component"
const SECTION_PHRASE_RE =
  /\bthe\s+([\w][\w\s-]{1,30}?)\s+(?:section|area|block|part|component|region)\b/i;

// Pattern 2: known section keyword anywhere in the message
const KNOWN_SECTION_RE =
  /\b(hero|banner|about|values?|mission|vision|team|features?|benefits?|services?|pricing|gallery|testimonials?|reviews?|faq|contact|footer|header|nav(?:bar|igation)?|stats?|metrics?|blog|news|card[\s-]grid|icon[\s-]cards?|cta|call[\s-]to[\s-]action)\b/i;

export function detectSectionHint(message: string): string | null {
  const m1 = message.match(SECTION_PHRASE_RE);
  if (m1) return m1[1].trim().toLowerCase();

  const m2 = message.match(KNOWN_SECTION_RE);
  if (m2) return m2[1].trim().toLowerCase();

  return null;
}

// ── Chrome detection ──────────────────────────────────────────────────────────

function findLocalChrome(): string {
  const lappdata = process.env.LOCALAPPDATA ?? '';
  const pf = process.env.PROGRAMFILES ?? 'C:\\Program Files';
  const pf86 = process.env['PROGRAMFILES(X86)'] ?? 'C:\\Program Files (x86)';

  const candidates = [
    `${pf}\\Google\\Chrome\\Application\\chrome.exe`,
    `${pf86}\\Google\\Chrome\\Application\\chrome.exe`,
    `${lappdata}\\Google\\Chrome\\Application\\chrome.exe`,
    `${pf86}\\Microsoft\\Edge\\Application\\msedge.exe`,
    `${pf}\\Microsoft\\Edge\\Application\\msedge.exe`,
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ];

  for (const p of candidates) {
    if (p && existsSync(p)) return p;
  }

  throw new Error(
    'No Chrome/Edge found. Set PUPPETEER_EXECUTABLE_PATH to the Chrome binary.'
  );
}

// ── Section element finder ────────────────────────────────────────────────────

async function findSectionElement(
  page: Page,
  hint: string
): Promise<ElementHandle<Element> | null> {
  // 1. Simple CSS selectors — fast path
  const selectors = [
    `[data-section="${hint}"]`,
    `[data-section*="${hint}"]`,
    `#${hint}`,
    `#${hint}-section`,
    `section#${hint}`,
  ];
  for (const sel of selectors) {
    try {
      const el = await page.$(sel);
      if (el) {
        console.log(`[server-screenshot] Section "${hint}" matched by selector: ${sel}`);
        return el as ElementHandle<Element>;
      }
    } catch { /* invalid selector — skip */ }
  }

  // 2. Heading text search + walk up to nearest block
  const handle = await page.evaluateHandle((sectionHint: string) => {
    const lower = sectionHint.toLowerCase();

    // Search headings for a match
    for (const h of Array.from(document.querySelectorAll('h1,h2,h3,h4'))) {
      if ((h.textContent ?? '').toLowerCase().includes(lower)) {
        const parent =
          h.closest('section') ||
          h.closest('article') ||
          h.closest('[class]') ||
          h.parentElement;
        return parent ?? null;
      }
    }

    // Search class / id containing hint
    const byClass =
      document.querySelector(`section[class*="${sectionHint}"]`) ||
      document.querySelector(`div[id*="${sectionHint}"]`) ||
      document.querySelector(`[class*="${sectionHint}-"]`);
    return byClass ?? null;
  }, hint);

  const el = handle.asElement() as ElementHandle<Element> | null;
  if (!el) {
    void handle.dispose().catch(() => {});
  }
  return el;
}

// ── Main export ───────────────────────────────────────────────────────────────

// Renders an HTML string in headless Chromium and returns a base64-encoded
// JPEG. When sectionHint is provided, tries to crop to that element.
// Logs each pipeline step so the full path can be verified in server logs.
export async function screenshotHtmlServer(
  html: string,
  sectionHint?: string | null
): Promise<string | null> {
  let browser;
  const outPath = join(tmpdir(), `sm-ref-${Date.now()}.jpg`);

  try {
    const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

    let executablePath: string;
    let launchArgs: string[] = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
    ];

    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    } else if (isServerless) {
      const { default: chromium } = await import('@sparticuz/chromium');
      executablePath = await chromium.executablePath();
      launchArgs = chromium.args;
    } else {
      executablePath = findLocalChrome();
    }

    browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: launchArgs,
      defaultViewport: { width: 1280, height: 800 },
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 10_000 });

    // ── Step 1: Capture ────────────────────────────────────────────────────
    let rawBuf: Buffer;

    if (sectionHint) {
      const el = await findSectionElement(page, sectionHint);
      if (el) {
        console.log(`[server-screenshot] Cropped capture: section="${sectionHint}"`);
        rawBuf = Buffer.from(await el.screenshot({ type: 'jpeg', quality: 85 }) as Buffer);
      } else {
        console.log(`[server-screenshot] Section "${sectionHint}" not found — full page fallback`);
        rawBuf = Buffer.from(await page.screenshot({ type: 'jpeg', quality: 85, fullPage: false }) as Buffer);
      }
    } else {
      rawBuf = Buffer.from(await page.screenshot({ type: 'jpeg', quality: 85, fullPage: false }) as Buffer);
    }

    // Save to disk so Step 1 is independently verifiable
    writeFileSync(outPath, rawBuf);
    console.log(`[server-screenshot] Step 1 ✓  saved ${rawBuf.length} bytes → ${outPath}`);

    // ── Step 2: Read back + base64 encode ──────────────────────────────────
    const fileBytes = readFileSync(outPath);
    const base64 = fileBytes.toString('base64');
    console.log(`[server-screenshot] Step 2 ✓  base64 length=${base64.length}  prefix="${base64.slice(0, 80)}"`);

    return base64;
  } catch (err) {
    console.error('[server-screenshot] ✗ pipeline failed:', err);
    return null;
  } finally {
    if (browser) {
      try { await browser.close(); } catch {}
    }
  }
}
