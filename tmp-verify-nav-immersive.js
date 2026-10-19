const { chromium } = require('playwright')

async function navOpacity(page) {
  return page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Navigazione principale"]')
    return nav ? window.getComputedStyle(nav).opacity : null
  })
}

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  page.setDefaultTimeout(45000)
  await page.goto('http://localhost:3000/home', { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: 'Resident Evil' }).or(page.getByRole('heading', { level: 1 })).first().waitFor({ timeout: 40000 })
  await page.mouse.move(720, 480)
  await page.waitForTimeout(2300)
  const hiddenOnHero = await navOpacity(page)
  await page.screenshot({ path: 'tmp-nav-hero-hidden.png' })

  await page.mouse.move(220, 680)
  await page.waitForTimeout(400)
  const shownOnMeta = await navOpacity(page)
  await page.screenshot({ path: 'tmp-nav-hero-meta.png' })

  await page.mouse.move(720, 8)
  await page.waitForTimeout(300)
  const shownOnTop = await navOpacity(page)

  await page.mouse.move(720, 480)
  await page.evaluate(() => window.scrollTo(0, 900))
  await page.waitForTimeout(400)
  const shownOnScroll = await navOpacity(page)
  await page.screenshot({ path: 'tmp-nav-scrolled.png' })

  console.log(JSON.stringify({ hiddenOnHero, shownOnMeta, shownOnTop, shownOnScroll }))
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
