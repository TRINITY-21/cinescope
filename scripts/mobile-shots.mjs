import { chromium } from 'playwright';

const BASE = 'http://localhost:4001';
const ROUTES = [
  '/',
  '/movies',
  '/movie/1428857',
  '/movie/1428857/watch',
  '/show/169',
  '/show/169/watch',
  '/tracking',
  '/genres',
  '/country',
  '/anime',
  '/schedule',
  '/calendar',
  '/compare',
  '/discover',
  '/search',
  '/people',
  '/best',
  '/like',
  '/director',
  '/streaming',
];

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
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
    const out = `/tmp/mob-${safe || 'home'}.png`;
    await page.screenshot({ path: out, fullPage: false });
    console.log(`  → ${out}`);
  } catch (err) {
    console.log(`  ✗ ${err.message.slice(0, 80)}`);
  }
}

await browser.close();
