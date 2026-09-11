import { test, expect } from '@playwright/test'

test.describe('Smoke test piattaforma', () => {
    test('health API risponde', async ({ request }) => {
        const response = await request.get('/api/health')
        expect(response.ok()).toBeTruthy()
    })

    test('app TV mostra la scelta profilo', async ({ page }) => {
        await page.goto('/living', { waitUntil: 'domcontentloaded' })
        await expect(page.getByRole('heading', { name: 'Chi guarda?' })).toBeVisible()
    })

    test('telecomando sposta il focus tra i profili', async ({ page }) => {
        await page.goto('/living', { waitUntil: 'domcontentloaded' })
        await expect(page.getByRole('heading', { name: 'Chi guarda?' })).toBeVisible()
        const tiles = page.locator('[data-tv-focus]')
        await expect(tiles.first()).toBeVisible()
        await expect(tiles.first()).toHaveClass(/is-tv-focused/, { timeout: 10_000 })

        const firstLabel = ((await tiles.first().innerText()) || '').trim()
        await page.keyboard.press('ArrowRight')
        await expect
            .poll(async () => ((await page.locator('[data-tv-focus].is-tv-focused').innerText()) || '').trim())
            .not.toBe(firstLabel)

        await page.evaluate(() => {
            window.dispatchEvent(
                new KeyboardEvent('keydown', {
                    key: 'Unidentified',
                    keyCode: 37,
                    bubbles: true,
                    cancelable: true,
                })
            )
        })
        await expect(tiles.first()).toBeFocused()
    })

    test('pagina ricerca statica', async ({ page }) => {
        await page.goto('/search', { waitUntil: 'domcontentloaded' })
        await expect(page.locator('body')).toBeVisible()
    })

    test('home SSR espone sezioni principali', async ({ page }) => {
        test.slow()
        await page.goto('/home', { waitUntil: 'domcontentloaded', timeout: 60_000 })
        await expect(page.getByRole('heading', { name: 'Top 10 Titoli Oggi' })).toBeVisible({
            timeout: 30_000,
        })
    })
})
