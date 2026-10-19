const { chromium } = require('playwright')

async function shot(page, name) {
  await page.screenshot({ path: name, fullPage: false })
}

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  page.setDefaultTimeout(45000)
  await page.goto('http://localhost:3000/home', { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: 'Scelti per te oggi' }).waitFor({ timeout: 40000 })
  await page.waitForTimeout(1200)
  const metrics = await page.evaluate(() => {
    const hero = document.querySelector('.home-hero')
    const continua = Array.from(document.querySelectorAll('h2')).find((h) =>
      (h.textContent || '').includes('Continua a guardare')
    )
    const scelti = Array.from(document.querySelectorAll('h2')).find((h) =>
      (h.textContent || '').includes('Scelti per te oggi')
    )
    const firstRail = continua || scelti
    const heroBox = hero?.getBoundingClientRect()
    const railBox = firstRail?.getBoundingClientRect()
    return {
      vh: window.innerHeight,
      heroHeight: heroBox ? Math.round(heroBox.height) : null,
      heroBottom: heroBox ? Math.round(heroBox.bottom) : null,
      firstRailTitle: firstRail?.textContent || null,
      railTop: railBox ? Math.round(railBox.top) : null,
      peekPx: railBox ? Math.round(window.innerHeight - railBox.top) : null,
    }
  })
  console.log(JSON.stringify(metrics, null, 2))
  await shot(page, 'tmp-hero-taller-desktop.png')

  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(400)
  await shot(page, 'tmp-hero-taller-mobile.png')
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
