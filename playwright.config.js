// @ts-check
const { defineConfig, devices } = require('@playwright/test')

/**
 * E2E runs against a running app (e.g. npm run dev or deployed preview).
 * Set PLAYWRIGHT_BASE_URL to override (e.g. https://nickisflavorhouse.com).
 * For admin flow, set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD.
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    video: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run dev',
        url: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
        reuseExistingServer: true,
      },
})
