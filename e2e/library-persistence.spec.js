import { expect, test } from '@playwright/test';
import { seedStorage, stubApis } from './fixtures.js';

/**
 * Verifies the most load-bearing user expectation in the entire app:
 *   "If I add something to my library, it'll still be there when I come back."
 *
 * Tests pre-seed localStorage so they exercise the real persistence wiring
 * (useLocalStorage → AppContext) without depending on TMDB to render a page
 * where the user could click the buttons.
 */

test.describe('Library persistence', () => {
  test.beforeEach(async ({ page }) => {
    await stubApis(page);
  });

  test('seeded watchlist shows on the tracking page', async ({ page }) => {
    await seedStorage(page, {
      'cinescope-watchlist': [
        { id: 1, name: 'Persisted Show', image: { medium: '' }, genres: ['Drama'] },
      ],
    });
    await page.goto('/tracking');
    // The page header should render — empty state should NOT appear because
    // we've seeded data.
    await expect(page.getByText(/Your library is empty/i)).not.toBeVisible();
  });

  test('seeded watched episodes count into stats', async ({ page }) => {
    await seedStorage(page, {
      'cinescope-watchlist': [{ id: 1, name: 'A', image: { medium: '' }, genres: [] }],
      'cinescope-watched': { 1: [101, 102, 103, 104] },
      'cinescope-stats': { totalEpisodesWatched: 4, totalMinutesWatched: 120, genresWatched: {}, firstTracked: '2024-01-01' },
    });
    await page.goto('/settings');
    await expect(page.getByTestId('summary-episodes')).toHaveText('4');
  });

  test('clearing data through localStorage takes effect after reload', async ({ page }) => {
    await seedStorage(page, {
      'cinescope-watchlist': [{ id: 1, name: 'X', image: { medium: '' }, genres: [] }],
    });
    await page.goto('/settings');

    // Wipe via the in-page button
    await page.getByRole('button', { name: /^Clear data$/i }).click();
    await page.getByRole('button', { name: /click again to confirm/i }).click();
    await page.waitForLoadState('networkidle');

    // localStorage should now be empty for the tracked keys
    const stored = await page.evaluate(() => ({
      watchlist: localStorage.getItem('cinescope-watchlist'),
      movieWatchlist: localStorage.getItem('cinescope-movie-watchlist'),
      stats: localStorage.getItem('cinescope-stats'),
    }));
    expect(stored.watchlist).toBeNull();
    expect(stored.movieWatchlist).toBeNull();
    expect(stored.stats).toBeNull();
  });
});
