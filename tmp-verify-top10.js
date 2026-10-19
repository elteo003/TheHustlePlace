const http = require('http')
const fs = require('fs')
const path = require('path')
const { chromium } = require('playwright')

const PORT = 4178
const ROOT = path.join(__dirname, 'public')
const html = fs.readFileSync(path.join(ROOT, 'tv-os.html'))

const posters = [
  '/8Y43POKjjKDGI9MH89NW0NAzzp8.jpg',
  '/qNBAXBIQlnOThrVvA6mA2B5ggV6.jpg',
  '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
]

const top = Array.from({ length: 10 }, (_, i) => ({
  id: 1000 + i,
  tmdb_id: 1000 + i,
  title: 'Titolo ' + (i + 1),
  name: 'Titolo ' + (i + 1),
  overview: 'Trama di prova per il ranking ' + (i + 1) + '.',
  poster_path: posters[i % posters.length],
  backdrop_path: posters[i % posters.length],
  type: 'movie',
  contentType: 'movie',
}))

function send(res, code, type, body) {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' })
  res.end(body)
}

function json(res, data) {
  send(res, 200, 'application/json', JSON.stringify(data))
}

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0]
  if (url === '/api/household') {
    return json(res, {
      configured: false,
      profiles: [{ id: 'local', name: 'Ospite', avatar: 0, pairCode: null }],
      activeProfileId: 'local',
    })
  }
  if (url === '/api/catalog/top-10') return json(res, { data: top })
  if (url === '/api/catalog/personal') {
    return json(res, { data: { picks: [], affinity: [], treasures: [] } })
  }
  if (url === '/api/catalog/editorial') {
    return json(res, { data: { warAndPolitics: [], politicalIntrigue: [], periodStories: [] } })
  }
  if (url === '/api/watch-history') return json(res, { configured: false, entries: [] })
  if (url.indexOf('/api/') === 0) return json(res, { data: [] })
  if (url.indexOf('/living') === 0 || url === '/' || url === '/tv-os.html') {
    return send(res, 200, 'text/html; charset=utf-8', html)
  }
  send(res, 404, 'text/plain', 'no')
})

async function main() {
  await new Promise((resolve) => server.listen(PORT, resolve))
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  page.setDefaultTimeout(25000)
  await page.goto('http://127.0.0.1:' + PORT + '/living', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('h1', { timeout: 15000 })
  await page.waitForTimeout(600)
  await page.keyboard.press('Enter')
  await page.waitForSelector('.top10-rank', { timeout: 20000 })
  await page.waitForTimeout(900)
  await page.keyboard.press('ArrowDown')
  await page.waitForTimeout(400)
  await page.keyboard.press('ArrowDown')
  await page.waitForTimeout(700)
  const info = await page.evaluate(() => {
    const ranks = Array.from(document.querySelectorAll('.top10-rank')).map((n) => n.textContent)
    const first = document.querySelector('.top10-rank')
    const tile = document.querySelector('.tile .top10-rank') && document.querySelector('.tile .top10-rank').parentNode
    const focused = document.querySelector('.is-tv-focused')
    const box = tile ? tile.getBoundingClientRect() : null
    return {
      ranks,
      count: document.querySelectorAll('.top10-rank').length,
      focused: focused ? focused.getAttribute('data-fid') : null,
      rankSize: first ? getComputedStyle(first).fontSize : null,
      tile: box ? { w: Math.round(box.width), h: Math.round(box.height) } : null,
    }
  })
  console.log(JSON.stringify(info, null, 2))
  await page.screenshot({ path: 'tmp-top10-1.png' })
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'tmp-top10-2.png' })
  await browser.close()
  server.close()
}

main().catch((err) => {
  console.error(err)
  try { server.close() } catch (e) {}
  process.exit(1)
})
