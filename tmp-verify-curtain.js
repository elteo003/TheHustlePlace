const { chromium } = require('playwright')

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  page.setDefaultTimeout(45000)
  await page.goto('http://localhost:3000/home', { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: 'Scelti per te oggi' }).waitFor({ timeout: 40000 })

  const readHero = async () =>
    page.evaluate(() => {
      const iframe = document.querySelector('.relative.h-\\[calc\\(100dvh-13\\.5rem\\)\\] iframe, [class*="min-h-[22rem]"] iframe')
      const hero = document.querySelector('[class*="min-h-[22rem]"]')
      const frame = hero?.querySelector('iframe') || document.querySelector('iframe')
      if (!frame) return { hasIframe: false }
      const style = window.getComputedStyle(frame)
      return {
        hasIframe: true,
        opacity: style.opacity,
        title: frame.getAttribute('title'),
      }
    })

  await page.waitForTimeout(1500)
  const early = await readHero()
  await page.screenshot({ path: 'tmp-curtain-hero-early.png' })

  await page.waitForTimeout(7000)
  const late = await readHero()
  await page.screenshot({ path: 'tmp-curtain-hero-late.png' })

  console.log(JSON.stringify({ early, late }, null, 2))
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
