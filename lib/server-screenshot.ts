import puppeteer from 'puppeteer-core';
import { existsSync } from 'fs';

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
    'No Chrome/Edge executable found for server screenshots. ' +
    'Set PUPPETEER_EXECUTABLE_PATH to the Chrome binary path.'
  );
}

// Renders an HTML string in a headless browser at 1280×800 and returns a
// base64-encoded JPEG — no data: prefix. Returns null on any failure.
export async function screenshotHtmlServer(html: string): Promise<string | null> {
  let browser;
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

    const buf = await page.screenshot({ type: 'jpeg', quality: 80 });
    return Buffer.from(buf).toString('base64');
  } catch (err) {
    console.error('[server-screenshot] failed:', err);
    return null;
  } finally {
    if (browser) {
      try { await browser.close(); } catch {}
    }
  }
}
