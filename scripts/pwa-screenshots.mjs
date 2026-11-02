/**
 * Captures the install-dialog screenshots listed in the web manifest
 * (`src/app/[lang]/manifest.webmanifest/route.ts`) into `public/screenshots/`.
 *
 *   node scripts/pwa-screenshots.mjs [baseUrl] [screen…]   # default http://localhost:7006, every screen
 *
 * Point it at production for the cleanest shots (no dev indicator, real question pool).
 * Chrome shows its richer install dialog only with screenshots of both form factors: `narrow`
 * on phones, `wide` on desktop. Each side must be 320–3840px and the long side at most 2.3×
 * the short one.
 */
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const BASE_URL = (process.argv[2] ?? 'http://localhost:7006').replace(/\/$/, '')
const ONLY = process.argv.slice(3)
const OUT_DIR = fileURLToPath(new URL('../public/screenshots/', import.meta.url))

const FORM_FACTORS = {
  narrow: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  // Tall enough for the whole board: the desktop game stacks lifelines, question and answers.
  wide: { viewport: { width: 1280, height: 920 }, deviceScaleFactor: 1.5 },
}

/**
 * Lets entrance animations finish and parks the pointer, so no hover or tooltip is caught.
 * Hides Next's dev indicator, so a local capture is as clean as a production one.
 */
const settle = async (page) => {
  await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' })
  await page.mouse.move(0, 0)
  await page.waitForTimeout(2500)
}

/** Keys match the manifest's `screenshots` entries. */
const SCREENS = {
  home: async (page) => {
    await page.goto(`${BASE_URL}/en`)
  },
  game: async (page) => {
    await page.goto(`${BASE_URL}/en/play`)
    await page.getByRole('button', { name: 'Start game' }).click()
    await page.getByRole('button', { name: /^Option D:/ }).waitFor({ timeout: 30_000 })
  },
  // The switcher's dialog lists every language by its own name: the range at a glance.
  languages: async (page) => {
    await page.goto(`${BASE_URL}/en`)
    await page.getByRole('button', { name: 'Choose your language' }).first().click()
    await page.getByRole('dialog').waitFor()
  },
  categories: async (page) => {
    await page.goto(`${BASE_URL}/en/categories`)
  },
}

const browser = await chromium.launch()
await mkdir(OUT_DIR, { recursive: true })

for (const [formFactor, contextOptions] of Object.entries(FORM_FACTORS)) {
  const context = await browser.newContext({ ...contextOptions, locale: 'en-US', colorScheme: 'dark' })
  for (const [name, open] of Object.entries(SCREENS)) {
    if (ONLY.length && !ONLY.includes(name)) continue
    const page = await context.newPage()
    await open(page)
    await settle(page)
    const file = `${OUT_DIR}${name}-${formFactor}.jpg`
    await page.screenshot({ path: file, type: 'jpeg', quality: 85 })
    console.log(`✓ ${file}`)
    await page.close()
  }
  await context.close()
}

await browser.close()
