const http = require('http')
const fs = require('fs')
const path = require('path')
const { chromium } = require('playwright')

const PORT = 4177
const ROOT = path.join(__dirname, 'public')
const html = fs.readFileSync(path.join(ROOT, 'tv-os.html'))

const seasons = [1, 2, 3].map((sn) => ({
  season_number: sn,
  episodes: Array.from({ length: 8 }, (_, i) => {
    const n = i + 1
    return {
      episode_number: n,
      name: sn === 1 && n === 3 ? 'First Dance' : 'Puntata ' + n + ' stagione ' + sn,
      overview:
        'Jack Reacher arriva in una cittadina del Georgia e scopre che il suo nome e il suo passato sono finiti al centro di un omicidio. La trama deve restare leggibile dal divano, quindi il testo e lungo e chiaro.',
      runtime: 48 + n,
      still_path: '/8Y43POKjjKDGI9MH89NW0NAzzp8.jpg',
    }
  }),
}))

function send(res, code, type, body) {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' })
  res.end(body)
}

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0]
  if (url === '/api/household') {
    return send(res, 200, 'application/json', JSON.stringify({
      configured: false,
      profiles: [{ id: 'local', name: 'Ospite', avatar: 0, pairCode: null }],
      activeProfileId: 'local',
    }))
  }
  if (url === '/api/tmdb/tv/108978') {
    return send(res, 200, 'application/json', JSON.stringify({
      data: {
        id: 108978,
        name: 'Reacher',
        overview: 'Jack Reacher, ex poliziotto militare, si ferma in una piccola citta e si ritrova accusato di omicidio.',
        vote_average: 8.1,
        first_air_date: '2022-02-04',
        backdrop_path: '/8Y43POKjjKDGI9MH89NW0NAzzp8.jpg',
        poster_path: '/8Y43POKjjKDGI9MH89NW0NAzzp8.jpg',
      },
    }))
  }
  if (url === '/api/tmdb/tv/108978/seasons') {
    return send(res, 200, 'application/json', JSON.stringify({ data: seasons }))
  }
  if (url === '/api/watch-history') {
    return send(res, 200, 'application/json', JSON.stringify({
      configured: false,
      entries: [{
        id: 108978,
        type: 'tv',
        title: 'Reacher',
        season: 1,
        episode: 3,
        progress: 42,
        currentTime: 620,
      }],
    }))
  }
  if (url.indexOf('/api/') === 0) {
    return send(res, 200, 'application/json', JSON.stringify({ data: [] }))
  }
  if (url.indexOf('/living') === 0 || url === '/' || url === '/tv-os.html') {
    return send(res, 200, 'text/html; charset=utf-8', html)
  }
  const file = path.join(ROOT, url.replace(/^\//, ''))
  if (file.indexOf(ROOT) === 0 && fs.existsSync(file) && fs.statSync(file).isFile()) {
    const ext = path.extname(file)
    const types = { '.png': 'image/png', '.jpg': 'image/jpeg', '.js': 'text/javascript', '.css': 'text/css' }
    return send(res, 200, types[ext] || 'application/octet-stream', fs.readFileSync(file))
  }
  send(res, 404, 'text/plain', 'no')
})

function measure(page) {
  return page.evaluate(() => {
    const focused = document.querySelector('.is-tv-focused')
    const plot = document.querySelector('.ep-card-plot')
    const still = document.querySelector('.ep-card-still')
    const card = document.querySelector('.ep-card')
    const watched = document.querySelector('.ep-card.episode-watched')
    const track = document.querySelector('.series-track')
    const body = document.querySelector('.series-body')
    const menu = document.querySelector('.season-menu, .season-toggle, .ep-row')
    const on = Array.from(document.querySelectorAll('.season-chip.on')).map((n) => n.textContent)
    const firstTitle = document.querySelector('.ep-card-title')
    const titles = Array.from(document.querySelectorAll('.ep-card-title')).slice(0, 3).map((n) => n.textContent)
    let glow = null
    if (watched) {
      const cs = getComputedStyle(watched, '::before')
      glow = {
        overflow: getComputedStyle(watched).overflow,
        left: cs.left,
        width: cs.width,
        bg: (cs.backgroundImage || '').slice(0, 80),
      }
    }
    return {
      h1: (document.querySelector('.series-hero-copy h1') || {}).textContent || null,
      chips: Array.from(document.querySelectorAll('.season-chip')).map((n) => n.textContent),
      cards: document.querySelectorAll('.ep-card').length,
      focused: focused ? focused.getAttribute('data-fid') : null,
      focusedClass: focused ? focused.className : null,
      plotSize: plot ? getComputedStyle(plot).fontSize : null,
      plotH: plot ? plot.getBoundingClientRect().height : null,
      still: still ? still.getBoundingClientRect() : null,
      card: card ? card.getBoundingClientRect() : null,
      watched: !!watched,
      glow,
      seasonOn: on,
      firstTitle: firstTitle ? firstTitle.textContent : null,
      titles,
      trackTransform: track ? (track.style.transform || getComputedStyle(track).transform) : null,
      scrollTop: body ? body.scrollTop : null,
      menu: !!menu,
    }
  })
}

async function main() {
  await new Promise((resolve) => server.listen(PORT, resolve))
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  page.setDefaultTimeout(20000)
  await page.addInitScript(() => {
    localStorage.setItem('thp_watch_history', JSON.stringify([{
      id: 108978,
      type: 'tv',
      title: 'Reacher',
      season: 1,
      episode: 3,
      progress: 42,
      currentTime: 620,
      watchedAt: Date.now(),
    }]))
  })
  await page.goto('http://127.0.0.1:' + PORT + '/living/series/108978', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.ep-card', { timeout: 15000 })
  await page.waitForTimeout(800)
  const initial = await measure(page)
  console.log('INITIAL', JSON.stringify(initial, null, 2))
  await page.screenshot({ path: 'tmp-series-1.png' })

  await page.keyboard.press('ArrowUp')
  await page.waitForTimeout(500)
  const onSeasons = await measure(page)
  console.log('ON_SEASONS', JSON.stringify({ focused: onSeasons.focused, seasonOn: onSeasons.seasonOn, track: onSeasons.trackTransform }))
  await page.screenshot({ path: 'tmp-series-2.png' })

  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(700)
  const afterSeason = await measure(page)
  console.log('AFTER_SEASON', JSON.stringify({
    focused: afterSeason.focused,
    seasonOn: afterSeason.seasonOn,
    firstTitle: afterSeason.firstTitle,
    titles: afterSeason.titles,
    h1: afterSeason.h1,
    menu: afterSeason.menu,
  }))
  await page.screenshot({ path: 'tmp-series-3.png' })

  await page.keyboard.press('ArrowDown')
  await page.waitForTimeout(700)
  const onEps = await measure(page)
  console.log('ON_EPS', JSON.stringify({
    focused: onEps.focused,
    still: onEps.still,
    plotSize: onEps.plotSize,
    track: onEps.trackTransform,
    scrollTop: onEps.scrollTop,
  }))
  await page.screenshot({ path: 'tmp-series-4.png' })

  const page720 = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  await page720.addInitScript(() => {
    localStorage.setItem('thp_watch_history', JSON.stringify([{
      id: 108978, type: 'tv', title: 'Reacher', season: 1, episode: 3, progress: 42, currentTime: 620, watchedAt: Date.now(),
    }]))
  })
  await page720.goto('http://127.0.0.1:' + PORT + '/living/series/108978', { waitUntil: 'domcontentloaded' })
  await page720.waitForSelector('.ep-card')
  await page720.waitForTimeout(700)
  const r720 = await measure(page720)
  console.log('720P', JSON.stringify({
    focused: r720.focused,
    still: r720.still,
    plotSize: r720.plotSize,
    plotH: r720.plotH,
    card: r720.card,
    glow: r720.glow,
    track: r720.trackTransform,
  }))
  await page720.screenshot({ path: 'tmp-series-720.png' })

  await browser.close()
  server.close()
}

main().catch((err) => {
  console.error(err)
  try { server.close() } catch (e) {}
  process.exit(1)
})
