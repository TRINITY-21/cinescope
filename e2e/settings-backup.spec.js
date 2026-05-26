import { expect, test } from '@playwright/test';
import { seedStorage, stubApis } from './fixtures.js';

test.describe('Settings — backup, restore, clear', () => {
  test.beforeEach(async ({ page }) => {
    await stubApis(page);
  });

  test('the library summary reflects seeded data', async ({ page }) => {
    await seedStorage(page, {
      'cinescope-watchlist': [{ id: 1, name: 'A' }, { id: 2, name: 'B' }, { id: 3, name: 'C' }],
      'cinescope-movie-watchlist': [{ id: 10, title: 'M1' }, { id: 11, title: 'M2' }],
      'cinescope-watched': { 1: [101, 102], 2: [201] },
    });
    await page.goto('/settings');

    await expect(page.getByTestId('summary-shows')).toHaveText('3');
    await expect(page.getByTestId('summary-movies')).toHaveText('2');
    await expect(page.getByTestId('summary-episodes')).toHaveText('3');
  });

  test('Download backup triggers a JSON file download', async ({ page }) => {
    await seedStorage(page, {
      'cinescope-watchlist': [{ id: 1, name: 'Show A' }],
    });
    await page.goto('/settings');

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /download backup/i }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^bynge-backup-\d{4}-\d{2}-\d{2}\.json$/);
  });

  test('Clear data requires confirmation and wipes storage', async ({ page }) => {
    await seedStorage(page, {
      'cinescope-watchlist': [{ id: 1, name: 'Show A' }],
    });
    await page.goto('/settings');

    // First click — should ask for confirmation, not wipe yet
    await page.getByRole('button', { name: /^Clear data$/i }).click();
    await expect(page.getByRole('button', { name: /click again to confirm/i })).toBeVisible();

    // Second click — wipe + reload
    await page.getByRole('button', { name: /click again to confirm/i }).click();
    // Wait for the toast announcement
    await expect(page.getByText(/All data cleared/i)).toBeVisible();
    // Then the page reloads; counts go to 0
    await page.waitForLoadState('networkidle');

    // After reload, watchlist count should be 0
    await expect(page.getByTestId('summary-shows')).toHaveText('0');
  });

  test('Round-trip: export → clear → import restores the library', async ({ page }) => {
    await seedStorage(page, {
      'cinescope-watchlist': [
        { id: 100, name: 'Restored Show', image: { medium: '' }, genres: [] },
      ],
      'cinescope-stats': { totalEpisodesWatched: 7 },
    });
    await page.goto('/settings');

    // 1. Download the backup
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /download backup/i }).click();
    const download = await downloadPromise;
    const backupPath = await download.path();
    expect(backupPath).toBeTruthy();

    // 2. Confirm + clear
    await page.getByRole('button', { name: /^Clear data$/i }).click();
    await page.getByRole('button', { name: /click again to confirm/i }).click();
    await page.waitForLoadState('networkidle');

    // 3. Import via "Merge from file" → hidden file input
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(backupPath);

    // Toast appears + page reloads
    await expect(page.getByText(/Restored.*data sets/i)).toBeVisible({ timeout: 5_000 });
    await page.waitForLoadState('networkidle');

    // 4. Counts should match the original seed again
    await expect(page.getByTestId('summary-shows')).toHaveText('1');
  });
});
