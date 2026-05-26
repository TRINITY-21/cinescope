import { expect, test } from '@playwright/test';
import { stubApis } from './fixtures.js';

/**
 * Smoke test: every major route must boot without throwing into the
 * ErrorBoundary. The catch is that we don't assert specific UI — we just
 * verify the navbar still renders (proving the layout is alive) and that
 * the boundary's recovery UI hasn't fired.
 */

const ROUTES = [
  '/',
  '/movies',
  '/browse',
  '/discover',
  '/schedule',
  '/people',
  '/party',
  '/tracking',
  '/trending',
  '/hidden-gems',
  '/coming-soon',
  '/trailers',
  '/streaming',
  '/discover/mood/cozy',
  '/watch-order',
  '/settings',
  '/some/totally/invalid/path',  // should hit NotFoundPage cleanly
];

test.describe('Route smoke', () => {
  test.beforeEach(async ({ page }) => {
    await stubApis(page);
    // Treat any uncaught console error as a test failure.
    page.on('pageerror', (err) => {
      throw new Error(`Uncaught error on page: ${err.message}`);
    });
  });

  for (const route of ROUTES) {
    test(`route ${route} renders without crashing`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(response.status()).toBeLessThan(500);

      // Navbar should be visible on every route (it's outside Suspense).
      await expect(page.getByRole('link', { name: /^Bynge$/ })).toBeVisible({ timeout: 10_000 });

      // Error boundary recovery UI should NOT be visible.
      await expect(page.getByText(/Something broke/i)).not.toBeVisible();
    });
  }
});

test.describe('Navbar interactions', () => {
  test.beforeEach(async ({ page }) => {
    await stubApis(page);
  });

  test('Library dropdown opens and lists Settings', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /^Library/i }).first().click();
    await expect(page.getByRole('menuitem', { name: /Settings/i })).toBeVisible();
  });

  test('Pressing / opens the search overlay', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('/');
    // Search overlay should appear — look for the input or any search affordance
    await expect(page.locator('input[type="search"], input[placeholder*="earch"]').first())
      .toBeVisible({ timeout: 3_000 });
  });
});
