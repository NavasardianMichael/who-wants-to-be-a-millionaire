import { expect, test } from '@playwright/test'

test.describe('server-rendered content', () => {
  test('the home page ships its content without JavaScript', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto('/en')
    await expect(page.locator('h1')).toContainText('millionaire')
    // The ladder, the FAQ and the mode links are all in the server HTML.
    await expect(page.getByText('$1,000,000').first()).toBeVisible()
    await expect(page.locator('.ant-collapse-header').first()).toBeVisible()
    // In the HTML at every width (the header nav is hidden on phones, the mode cards are not).
    expect(await page.locator('a[href="/en/marathon"]').count()).toBeGreaterThan(0)
    await context.close()
  })

  test('every page declares its canonical and hreflang alternates', async ({ page }) => {
    await page.goto('/fr/play')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/fr\/play$/)
    expect(await page.locator('link[rel="alternate"][hreflang]').count()).toBeGreaterThanOrEqual(51)
  })

  test('right-to-left languages render right-to-left', async ({ page }) => {
    await page.goto('/ar')
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar')
  })
})

test.describe('locale negotiation', () => {
  test('an unprefixed URL goes to the browser language', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'hy-AM' })
    const page = await context.newPage()
    await page.goto('/play')
    await expect(page).toHaveURL(/\/hy\/play$/)
    await context.close()
  })
})

test.describe('classic game', () => {
  test('a player can start, use a lifeline, answer and walk away or finish', async ({ page }) => {
    await page.goto('/en/play')
    await page.getByRole('button', { name: 'Start game' }).click()

    const optionA = page.getByRole('button', { name: /^Option A:/ })
    await expect(optionA).toBeVisible({ timeout: 30_000 })

    await page.getByRole('button', { name: '50:50', exact: true }).click()
    await expect(page.getByRole('button', { name: /removed by 50:50/ })).toHaveCount(2, { timeout: 20_000 })

    // Pick the first option still on the board and confirm it.
    const remaining = page.getByRole('button', { name: /^Option [A-D]:/ })
    await remaining.first().click()
    await page.getByRole('button', { name: 'Final answer' }).click()

    // Either the next question arrives or the game ends; both are a working game.
    await expect(page.getByText(/Correct!|So close!|Wrong answer/).first()).toBeVisible({ timeout: 15_000 })
  })

  test('Switch the Question asks for a would-be answer, reveals it unscored, then switches', async ({ page }) => {
    await page.goto('/en/play')
    await page.getByRole('button', { name: 'Start game' }).click()
    await expect(page.getByRole('button', { name: /^Option A:/ })).toBeVisible({ timeout: 30_000 })
    const before = await page.getByRole('heading', { level: 2 }).first().textContent()

    await page.getByRole('button', { name: 'Switch the Question', exact: true }).click()
    await expect(page.getByText('Before we switch — what would you have answered?')).toBeVisible({ timeout: 10_000 })
    // The board has not changed yet.
    expect(await page.getByRole('heading', { level: 2 }).first().textContent()).toBe(before)

    await page.getByRole('button', { name: /^Option A:/ }).click()
    await expect(page.getByText(/You'd have got it right!|Good thing you switched!/)).toBeVisible({ timeout: 10_000 })

    // Then the new question, still on question 1 whatever the would-be answer was.
    await expect(page.getByText('Before we switch')).toBeHidden({ timeout: 15_000 })
    await expect(page.getByText('Question 1 of 15').first()).toBeVisible()
    await expect(page.getByRole('button', { name: /Switch the Question/ })).toBeDisabled()
  })

  test('leaving mid-game asks first, by link and by the back button', async ({ page }) => {
    await page.goto('/en')
    await page.goto('/en/play')
    await page.getByRole('button', { name: 'Start game' }).click()
    await expect(page.getByRole('button', { name: /^Option A:/ })).toBeVisible({ timeout: 30_000 })

    await page.getByRole('link', { name: 'Leaderboard' }).first().click()
    await expect(page.getByText('Leave this game?')).toBeVisible()
    await page.getByRole('button', { name: 'Keep playing' }).click()
    await expect(page).toHaveURL(/\/en\/play$/)

    await page.goBack()
    await expect(page.getByText('Leave this game?')).toBeVisible()
    await page.getByRole('button', { name: 'Leave game' }).last().click()
    await expect(page).toHaveURL(/\/en$/, { timeout: 10_000 })
  })
})
