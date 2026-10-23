import { defineConfig, devices } from '@playwright/test'

/**
 * E2E is opt-in, not part of `pnpm test`: it needs the whole stack running.
 *
 *   pnpm db:up && pnpm db:setup
 *   pnpm dev            # web :7006 + api :9006
 *   pnpm test:e2e
 *
 * Three viewports, because the game has three layouts: desktop (ladder column), tablet
 * (ladder drawer), phone (stacked answers, ladder sheet).
 */
const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:7006'

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'blob' : 'list',
  timeout: 90_000,
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'tablet', use: { ...devices['iPad (gen 7)'], browserName: 'chromium' } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
})
