const { chromium } = require('playwright')
const http = require('http')
const fs = require('fs')
const path = require('path')

const html = fs.readFileSync(path.join(__dirname, 'public/tv-os.html'))
const PORT = 4191
const seasons = [{
  season_number: 1,
  episodes: Array.from({ length: 4 }, (_, i) => ({
    episode_number: i + 1,
    name: 'Puntata ' + (i + 1),
    overview: 'Trama di prova.',
    runtime: 55,
    still_path: '/8Y43POKjjKDGI9MH89NW0NAzzp8.jpg',
  })),
}]

function send(res, code, type, body) {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' })
  res.end(body)
}

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0]
  if (url === '/api/household') {
    return send(res, 200, 'application/json', JSON.stringify({
      configured: true,
      profiles: [{ id: 'local', name: 'Ospite', avatar: 0, pairCode: null }],
      activeProfileId: 'local',
    }))
  }
  if (url === '/api/tmdb/tv/108978') {
    return send(res, 200, 'application/json', JSON.stringify({
      success: true,
      data: { id: 108978, name: 'Reacher', overview: 'x', vote_average: 8, first_air_date: '2022-01-01', backdrop_path: '/x.jpg', poster_path: '/x.jpg' },
    }))
  }
  if (url === '/api/tmdb/tv/108978/seasons') {
    return send(res, 200, 'application/json', JSON.stringify({ success: true, data: seasons }))
  }
  if (url.indexOf('/api/') === 0) return send(res, 200, 'application/json', JSON.stringify({ success: true, data: [] }))
  return send(res, 200, 'text/html; charset=utf-8', html)
})

async function main() {
  const browser = await chromium.launch()
  const web = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await web.addInitScript(() => {
    localStorage.setItem('thp_watch_history', JSON.stringify([{
      id: 108978, type: 'tv', title: 'Reacher', season: 1, episode: 3,
      progress: 42, currentTime: 1421, duration: 3300, watchedAt: Date.now(),
    }]))
  })
  await web.goto('http://localhost:3000/series/108978', { waitUntil: 'domcontentloaded' })
  await web.waitForSelector('.episode-watched', { timeout: 45000 })
  await web.locator('.episode-watched').scrollIntoViewIfNeeded()
  const webGlow = await web.evaluate(() => {
    const el = document.querySelector('.episode-watched')
    const cs = getComputedStyle(el)
    const before = getComputedStyle(el, '::before')
    return {
      overflow: cs.overflow,
      isolation: cs.isolation,
      bg: before.backgroundImage.slice(0, 40),
      mask: before.webkitMaskImage || before.maskImage,
      inset: before.top + ' ' + before.bottom,
    }
  })
  await web.locator('.episode-watched').screenshot({ path: 'tmp-series-web-glow-pad.png' })
  console.log('WEB', JSON.stringify(webGlow))

  await new Promise((r) => server.listen(PORT, r))
  const tv = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  await tv.addInitScript(() => {
    const orig = history.replaceState.bind(history)
    history.replaceState = function (s, t, u) { if (u === '/living') return; return orig(s, t, u) }
    localStorage.setItem('thp_watch_history', JSON.stringify([{
      id: 108978, type: 'tv', title: 'Reacher', season: 1, episode: 3,
      progress: 42, currentTime: 1421, duration: 3300, watchedAt: Date.now(),
    }]))
  })
  await tv.goto('http://127.0.0.1:' + PORT + '/living/series/108978', { waitUntil: 'domcontentloaded' })
  await tv.waitForSelector('.ep-card.episode-watched', { timeout: 25000 })
  const tvGlow = await tv.evaluate(() => {
    const card = document.querySelector('.ep-card.episode-watched')
    const time = document.querySelector('.ep-card-time')
    const bar = card.querySelector('.ep-card-still b i')
    const before = getComputedStyle(card, '::before')
    return {
      bg: getComputedStyle(card).backgroundColor,
      before: before.backgroundImage.slice(0, 80),
      inset: before.inset || (before.top + '/' + before.left),
      time: time ? time.textContent : null,
      bar: bar ? bar.style.width : null,
    }
  })
  const box = await tv.locator('.ep-card.episode-watched').first().boundingBox()
  await tv.screenshot({
    path: 'tmp-series-tv-glow-pad.png',
    clip: { x: Math.max(0, box.x - 40), y: Math.max(0, box.y - 30), width: Math.min(900, box.width + 80), height: Math.min(640, box.height + 60) },
  })
  console.log('TV', JSON.stringify(tvGlow))
  await browser.close()
  server.close()
}

main().catch((err) => {
  console.error(err)
  try { server.close() } catch (e) {}
  process.exit(1)
})
