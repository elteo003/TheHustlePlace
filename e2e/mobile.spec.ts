import { test, expect, devices } from '@playwright/test'

const { defaultBrowserType: _browser, ...iphone } = devices['iPhone 12']

test.use(iphone)

test.describe('Telefono: codice e sottocinema', () => {

    test('il codice dispositivo sta nel viewport come sheet', async ({ page }) => {
        test.slow()
        await page.goto('/home', { waitUntil: 'domcontentloaded', timeout: 60_000 })
        await expect(page.getByRole('heading', { name: 'Top 10 Titoli Oggi' })).toBeVisible({
            timeout: 30_000,
        })

        await page.getByRole('button', { name: 'Codice' }).click()
        const dialog = page.getByRole('dialog', { name: 'Questo dispositivo' })
        await expect(dialog).toBeVisible()
        await expect(dialog).toBeInViewport()

        const viewport = page.viewportSize()
        const box = await dialog.boundingBox()
        expect(viewport).toBeTruthy()
        expect(box).toBeTruthy()
        if (!viewport || !box) {
            return
        }

        expect(box.width).toBeGreaterThan(viewport.width * 0.9)
        expect(box.width).toBeLessThanOrEqual(viewport.width + 1)
        expect(box.x).toBeGreaterThanOrEqual(-1)
        expect(box.y).toBeGreaterThanOrEqual(-1)
        expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 2)
    })

    test('tap su una locandina apre il sottocinema sotto la riga', async ({ page }) => {
        test.slow()
        await page.goto('/home', { waitUntil: 'domcontentloaded', timeout: 60_000 })
        await expect(page.getByRole('heading', { name: 'Top 10 Titoli Oggi' })).toBeVisible({
            timeout: 30_000,
        })

        const row = page.locator('section').filter({ hasText: 'Top 10 Titoli Oggi' })
        await row.getByRole('button').first().click()

        const dock = page.getByRole('region', { name: /Anteprima trailer/ })
        await expect(dock).toBeVisible({ timeout: 15_000 })
    })
})
