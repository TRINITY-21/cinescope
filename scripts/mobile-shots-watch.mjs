import { chromium } from 'playwright';

const BASE = 'http://localhost:4000';
const ROUTES = [
  '/movie/1428857/watch',
  '/tracking',
  '/trending/week',
];

const browser = await chromium.launch();
// Test at 320px — narrowest realistic phone width
const ctx = await browser.newContext({
  viewport: { width: 320, height: 568 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const page = await ctx.newPage();

for (const route of ROUTES) {
  const url = `${BASE}${route}`;
  console.log('→', url);
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25_000 });
    await page.waitForTimeout(2500);
    const safe = route.replace(/[\/?#]/g, '_').replace(/^_/, '');
    const out = `/tmp/mob320-${safe}.png`;
    await page.screenshot({ path: out, fullPage: false });
    console.log(`  → ${out}`);
  } catch (err) {
    console.log(`  ✗ ${err.message.slice(0, 80)}`);
  }
}

await browser.close();
