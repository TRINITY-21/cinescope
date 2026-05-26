import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright e2e config.
 *
 * Auto-starts `npm run dev` before running the suite. Tests live in /e2e
 * to keep them separate from the vitest unit/integration tests in /src.
 *
 * Tests mock the /api/proxy endpoint so they don't depend on real TMDB/OMDB
 * keys being present — keeps CI deterministic and avoids burning API quota.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'line' : 'list',
  use: {
    baseURL: 'http://localhost:4000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 5_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4000',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
