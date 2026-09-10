import { cache } from '@/utils/cache'
import { logger } from '@/utils/logger'
import {
    VIXSRC_PART_PREFIX,
    buildVixsrcPlaylistUrl,
    bytesToBase64,
    classifyHlsRef,
    isAllowedHlsUrl,
    parseVixsrcApiSrc,
    parseVixsrcEmbedHtml,
    rewriteM3u8Browser,
    unwrapAllOriginsBody,
    unwrapJinaBody,
} from '@/lib/vixsrc-hls'

export interface ResolvedVixsrcHls {
    master: string
    parts: Record<string, string>
    videoId?: number
}

const VIXSRC_BASE_URL = process.env.VIXSRC_BASE_URL || 'https://vixsrc.to'
const CACHE_TTL_SECONDS = 120
const BROWSER_UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

export const VIXSRC_FETCH_HEADERS = {
    'User-Agent': BROWSER_UA,
    Referer: `${VIXSRC_BASE_URL}/`,
    Accept: '*/*',
    'Accept-Language': 'it-IT,it;q=0.9,en;q=0.8',
} as const

type FetchMode = 'direct' | 'allorigins' | 'jina'

export function vixsrcRequestHeaders(extra?: HeadersInit): Headers {
    const headers = new Headers(VIXSRC_FETCH_HEADERS)
    if (extra) {
        new Headers(extra).forEach((value, key) => headers.set(key, value))
    }
    return headers
}

class VixsrcSession {
    private mode: FetchMode | null = null

    async fetch(url: string, extra?: HeadersInit): Promise<Response> {
        if (!this.mode) {
            this.mode = await this.pickMode(url, extra)
            logger.info('Transport VixSrc scelto', { mode: this.mode })
        }
        return this.fetchMode(this.mode, url, extra)
    }

    private async pickMode(url: string, extra?: HeadersInit): Promise<FetchMode> {
        const modes: FetchMode[] = ['direct', 'allorigins', 'jina']
        let lastError = 'API VixSrc non disponibile (403)'
        for (let i = 0; i < modes.length; i++) {
            const mode = modes[i]
            try {
                const response = await this.fetchMode(mode, url, extra)
                if (response.ok) return mode
                lastError = `API VixSrc non disponibile (${response.status}, ${mode})`
            } catch (error) {
                lastError = error instanceof Error ? error.message : lastError
            }
        }
        throw new Error(lastError)
    }

    private async fetchMode(mode: FetchMode, url: string, extra?: HeadersInit): Promise<Response> {
        if (mode === 'direct') {
            return fetch(url, {
                headers: vixsrcRequestHeaders(extra),
                cache: 'no-store',
                redirect: 'follow',
            })
        }
        if (mode === 'allorigins') {
            const proxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
            const response = await fetch(proxy, {
                cache: 'no-store',
                redirect: 'follow',
                signal: AbortSignal.timeout(20000),
            })
            if (!response.ok) return response
            const buffer = await response.arrayBuffer()
            return new Response(buffer, {
                status: 200,
                headers: { 'content-type': response.headers.get('content-type') || 'application/octet-stream' },
            })
        }
        const jina = await fetch(`https://r.jina.ai/${url}`, {
            headers: { 'X-Return-Format': extra && String(extra).includes('json') ? 'text' : 'html' },
            cache: 'no-store',
            signal: AbortSignal.timeout(20000),
        })
        const raw = await jina.text()
        if (!jina.ok) {
            return new Response(raw, { status: jina.status })
        }
        const body = unwrapJinaBody(unwrapAllOriginsBody(raw))
        if (body.includes('AssertionFailureError') || body.includes('unexpected content type')) {
            throw new Error('Manifest VixSrc non disponibile (jina)')
        }
        return new Response(body, { status: 200, headers: { 'content-type': 'text/plain' } })
    }
}

async function readOk(response: Response, label: string): Promise<Response> {
    if (!response.ok) {
        throw new Error(`${label} non disponibile (${response.status})`)
    }
    return response
}

export async function resolveVixsrcHls(input: {
    tmdbId: number
    type: 'movie' | 'tv'
    season?: number
    episode?: number
    lang?: string
}): Promise<ResolvedVixsrcHls> {
    const lang = input.lang ?? 'it'
    const cacheKey =
        input.type === 'movie'
            ? `vixsrc-hls-movie-${input.tmdbId}-${lang}`
            : `vixsrc-hls-tv-${input.tmdbId}-${input.season}-${input.episode}-${lang}`

    const cached = await cache.get<ResolvedVixsrcHls>(cacheKey)
    if (cached?.master) return cached

    const session = new VixsrcSession()
    const apiPath =
        input.type === 'movie'
            ? `/api/movie/${input.tmdbId}?lang=${encodeURIComponent(lang)}`
            : `/api/tv/${input.tmdbId}/${input.season}/${input.episode}?lang=${encodeURIComponent(lang)}`

    const apiResponse = await readOk(await session.fetch(`${VIXSRC_BASE_URL}${apiPath}`), 'API VixSrc')
    const src = parseVixsrcApiSrc(await apiResponse.text())
    if (!src) {
        throw new Error('Risposta API VixSrc senza embed')
    }

    const embedUrl = new URL(src, VIXSRC_BASE_URL)
    if (embedUrl.origin !== new URL(VIXSRC_BASE_URL).origin) {
        throw new Error('Embed VixSrc su origin non attesa')
    }

    const embedResponse = await readOk(await session.fetch(embedUrl.toString()), 'Embed VixSrc')
    const parsed = parseVixsrcEmbedHtml(await embedResponse.text())
    if (!parsed) {
        throw new Error('Playlist VixSrc non trovata nell\'embed')
    }

    const playlistUrl = buildVixsrcPlaylistUrl(parsed, lang)
    if (!isAllowedHlsUrl(playlistUrl)) {
        throw new Error('Playlist VixSrc su host non consentito')
    }

    const stream = await assembleBrowserStream(session, playlistUrl, parsed.videoId)
    await cache.set(cacheKey, stream, { ttl: CACHE_TTL_SECONDS })
    logger.info('Playlist VixSrc risolta', { tmdbId: input.tmdbId, type: input.type, videoId: parsed.videoId })
    return stream
}

async function assembleBrowserStream(
    session: VixsrcSession,
    masterUrl: string,
    videoId?: number
): Promise<ResolvedVixsrcHls> {
    const partIds = new Map<string, string>()
    const pending = [masterUrl]
    const fetched = new Map<string, string>()
    let keyUri: string | null = null

    const partIdFor = (url: string) => {
        const current = partIds.get(url)
        if (current) return current
        const id = `p${partIds.size}`
        partIds.set(url, id)
        pending.push(url)
        return id
    }

    const resolveRef = (absolute: string, kind: 'cdn' | 'playlist' | 'key') => {
        if (kind === 'cdn') return absolute
        if (kind === 'key') return keyUri ?? absolute
        return `${VIXSRC_PART_PREFIX}${partIdFor(absolute)}.m3u8`
    }

    while (pending.length) {
        const url = pending.shift()
        if (!url || fetched.has(url)) continue

        const response = await readOk(await session.fetch(url), 'Manifest VixSrc')
        const body = await response.text()
        if (!body.trimStart().startsWith('#EXTM3U') && !body.includes('#EXT')) {
            throw new Error('Manifest VixSrc non valido')
        }
        if (!keyUri) {
            const keyUrl = findKeyUrl(body, url)
            if (keyUrl) {
                const keyResponse = await readOk(await session.fetch(keyUrl), 'Chiave VixSrc')
                keyUri = `data:application/octet-stream;base64,${bytesToBase64(new Uint8Array(await keyResponse.arrayBuffer()))}`
            }
        }
        fetched.set(url, rewriteM3u8Browser(body, url, resolveRef))
    }

    const master = fetched.get(masterUrl)
    if (!master) throw new Error('Manifest principale VixSrc vuoto')

    const parts: Record<string, string> = {}
    partIds.forEach((id, url) => {
        const text = fetched.get(url)
        if (text) parts[id] = text
    })

    return { master, parts, videoId }
}

function findKeyUrl(body: string, sourceUrl: string): string | null {
    const re = /URI="([^"]+)"/gi
    let match: RegExpExecArray | null = re.exec(body)
    while (match) {
        const absolute = new URL(match[1], sourceUrl).toString()
        if (classifyHlsRef(absolute) === 'key') return absolute
        match = re.exec(body)
    }
    return null
}
