import { test, expect } from '@playwright/test'

test.describe('Smoke test piattaforma', () => {
    test('health API risponde', async ({ request }) => {
        const response = await request.get('/api/health')
        expect(response.ok()).toBeTruthy()
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
