const { chromium } = require('playwright')

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 820 } })
  await page.goto('http://127.0.0.1:4179/lab/youtube-trailer.html', { waitUntil: 'domcontentloaded' })
  const t0 = Date.now()
  const times = [4000, 5500, 7000, 8000, 9000, 10000, 11000]
  for (const t of times) {
    const wait = t - (Date.now() - t0)
    if (wait > 0) await page.waitForTimeout(wait)
    const stamp = await page.locator('#stamp').innerText()
    await page.locator('#naked').screenshot({ path: 'tmp-lab-naked-' + t + '.png' })
    await page.locator('#curtain').screenshot({ path: 'tmp-lab-curtain-' + t + '.png' })
    console.log((Date.now() - t0) + 'ms target=' + t + ' stamp=' + stamp)
  }
  console.log('--- log ---')
  console.log(await page.locator('#log').innerText())
  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
