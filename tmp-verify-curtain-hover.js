const { chromium } = require('playwright')

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  page.setDefaultTimeout(45000)
  await page.goto('http://localhost:3000/home', { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: 'Scelti per te oggi' }).waitFor({ timeout: 40000 })

  const section = page.locator('section').filter({ hasText: 'Scelti per te oggi' })
  const poster = section.locator('button, a, [class*="poster"]').first()
  await poster.hover()
  await page.waitForTimeout(2500)
  const dialog = page.getByRole('dialog')
  const earlyOpen = await dialog.isVisible().catch(() => false)
  if (earlyOpen) await dialog.screenshot({ path: 'tmp-curtain-hover-early.png' })

  const readPreview = async () =>
    page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]')
      if (!dialog) return { open: false }
      const img = dialog.querySelector('img')
      const iframe = dialog.querySelector('iframe')
      return {
        open: true,
        imgOpacity: img ? window.getComputedStyle(img).opacity : null,
        iframe: Boolean(iframe),
      }
    })

  const early = await readPreview()
  await page.waitForTimeout(8000)
  const late = await readPreview()
  if (await dialog.isVisible().catch(() => false)) {
    await dialog.screenshot({ path: 'tmp-curtain-hover-late.png' })
  }
  console.log(JSON.stringify({ earlyOpen, early, late }, null, 2))
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
