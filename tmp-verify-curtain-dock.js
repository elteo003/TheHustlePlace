const { chromium, devices } = require('playwright')

async function main() {
  const browser = await chromium.launch()
  const context = await browser.newContext({ ...devices['iPhone 13'] })
  const page = await context.newPage()
  page.setDefaultTimeout(45000)
  await page.goto('http://localhost:3000/home', { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: 'Top 10 Titoli Oggi' }).waitFor({ timeout: 40000 })
  const row = page.locator('section').filter({ hasText: 'Top 10 Titoli Oggi' })
  const poster = row.locator('[data-trailer-origin]').first()
  await poster.click({ position: { x: 16, y: 16 } })
  const dock = page.getByRole('region', { name: /Anteprima trailer/ })
  await dock.waitFor({ timeout: 15000 })
  await page.waitForTimeout(2000)
  const early = await page.evaluate(() => {
    const region = document.querySelector('[role="region"]')
    const video = region?.querySelector('iframe')?.parentElement
    return video ? window.getComputedStyle(video).opacity : null
  })
  await dock.screenshot({ path: 'tmp-curtain-dock-early.png' })
  await page.waitForTimeout(8000)
  const late = await page.evaluate(() => {
    const region = document.querySelector('[role="region"]')
    const video = region?.querySelector('iframe')?.parentElement
    return video ? window.getComputedStyle(video).opacity : null
  })
  await dock.screenshot({ path: 'tmp-curtain-dock-late.png' })
  console.log(JSON.stringify({ early, late }))
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
