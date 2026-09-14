import { test, expect, devices } from '@playwright/test'

const { defaultBrowserType: _browser, ...iphone } = devices['iPhone 12']

test.use(iphone)

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
        const original = window.matchMedia.bind(window)
        window.matchMedia = (query: string) => {
            if (query === '(pointer: coarse)' || query === '(hover: none)') {
                return {
                    matches: true,
                    media: query,
                    onchange: null,
                    addListener() {},
                    removeListener() {},
                    addEventListener() {},
                    removeEventListener() {},
                    dispatchEvent() {
                        return false
                    },
                } as MediaQueryList
            }
            return original(query)
        }
    })
})

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

        await expect
            .poll(async () => {
                const viewport = page.viewportSize()
                const box = await dialog.boundingBox()
                if (!viewport || !box) {
                    return 'missing'
                }
                if (box.width <= viewport.width * 0.9 || box.width > viewport.width + 1) {
                    return `width ${box.width}`
                }
                if (box.x < -1 || box.y < -1) {
                    return `origin ${box.x},${box.y}`
                }
                if (box.y + box.height > viewport.height + 2) {
                    return `bottom ${box.y + box.height} > ${viewport.height + 2}`
                }
                return 'ok'
            })
            .toBe('ok')
    })

    test('tap su una locandina apre il trailer a schermo intero', async ({ page }) => {
        test.slow()
        await page.goto('/home', { waitUntil: 'domcontentloaded', timeout: 60_000 })
        await expect(page.getByRole('heading', { name: 'Top 10 Titoli Oggi' })).toBeVisible({
            timeout: 30_000,
        })

        const row = page.locator('section').filter({ hasText: 'Top 10 Titoli Oggi' })
        const poster = row.locator('[data-trailer-origin]').first()
        await expect(poster).toBeVisible()
        await expect(poster.getByRole('button', { name: /^Guarda / })).toBeVisible()
        await poster.click({ position: { x: 16, y: 16 } })

        const dock = page.getByRole('region', { name: /Anteprima trailer/ })
        await expect(dock).toBeVisible({ timeout: 15_000 })
        await expect(dock).toBeInViewport()

        const viewport = page.viewportSize()
        const box = await dock.boundingBox()
        expect(viewport).toBeTruthy()
        expect(box).toBeTruthy()
        if (!viewport || !box) {
            return
        }

        expect(box.width).toBeGreaterThan(viewport.width * 0.9)
        expect(box.height).toBeGreaterThan(viewport.height * 0.85)
    })
})
