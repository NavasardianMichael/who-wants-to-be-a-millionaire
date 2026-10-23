import { defineConfig } from 'vitest/config'

/**
 * Two projects:
 * - `unit` — pure logic, no network, no database; runs anywhere in a couple of seconds.
 * - `integration` — the real Express app (supertest) against a throwaway `millionaire_test`
 *   database that `tests/setup/integration.ts` recreates and seeds on every run. Needs the
 *   Postgres container (`pnpm db:up`); Gemini is forced off so no test spends quota.
 */
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://millionaire:millionaire@localhost:5006/millionaire_test?schema=public'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/unit/**/*.spec.ts'],
          env: { TZ: 'UTC' },
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          environment: 'node',
          include: ['tests/integration/**/*.spec.ts'],
          globalSetup: ['tests/setup/integration.ts'],
          // One database: files must not interleave their writes.
          fileParallelism: false,
          env: {
            TZ: 'UTC',
            NODE_ENV: 'test',
            DATABASE_URL: TEST_DATABASE_URL,
            TEST_DATABASE_URL,
            GEMINI_KEY: '',
            GOOGLE_CLIENT_ID: '',
            GOOGLE_CLIENT_SECRET: '',
            JWT_SECRET: 'integration-test-secret',
            CORS_ORIGIN: 'http://localhost:7006',
            UPLOAD_DIR: './tests/.uploads',
            POOL_REFILL_ENABLED: 'false',
          },
        },
      },
    ],
  },
})
