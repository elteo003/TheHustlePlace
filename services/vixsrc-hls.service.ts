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

const FETCH_MODES: FetchMode[] = ['direct', 'allorigins', 'jina']

export function vixsrcRequestHeaders(extra?: HeadersInit): Headers {
    const headers = new Headers(VIXSRC_FETCH_HEADERS)
    if (extra) {
        new Headers(extra).forEach((value, key) => headers.set(key, value))
    }
    return headers
}

class VixsrcSession {
    constructor(private readonly mode: FetchMode) {}

    async fetch(url: string, extra?: HeadersInit): Promise<Response> {
        return this.fetchMode(url, extra)
    }

    async fetchText(url: string, extra?: HeadersInit): Promise<string> {
        const response = await this.fetchMode(url, extra)
        const text = await response.text()
        if (!response.ok) {
            throw new Error(`${this.mode} ${response.status}`)
        }
        return text
    }

    async fetchManifest(url: string): Promise<string> {
        const body = await this.fetchText(url)
        if (!body.includes('#EXTM3U') && !body.includes('#EXT-X')) {
            throw new Error(`Manifest VixSrc non valido (${this.mode})`)
        }
        return body
    }

    private async fetchMode(url: string, extra?: HeadersInit): Promise<Response> {
        if (this.mode === 'direct') {
            return fetch(url, {
                headers: vixsrcRequestHeaders(extra),
                cache: 'no-store',
                redirect: 'follow',
            })
        }
        if (this.mode === 'allorigins') {
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
            headers: { 'X-Return-Format': 'html', Accept: 'text/html' },
            cache: 'no-store',
            signal: AbortSignal.timeout(20000),
        })
        const raw = await jina.text()
        if (!jina.ok) {
            return new Response(raw, { status: jina.status })
        }
        const body = unwrapJinaBody(unwrapAllOriginsBody(raw))
        if (body.includes('AssertionFailureError') || body.includes('unexpected content type')) {
            return new Response(body, { status: 422 })
        }
        return new Response(body, { status: 200, headers: { 'content-type': 'text/plain' } })
    }
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

    const apiPath =
        input.type === 'movie'
            ? `/api/movie/${input.tmdbId}?lang=${encodeURIComponent(lang)}`
            : `/api/tv/${input.tmdbId}/${input.season}/${input.episode}?lang=${encodeURIComponent(lang)}`
    const apiUrl = `${VIXSRC_BASE_URL}${apiPath}`

    let lastError = 'API VixSrc non disponibile (403)'
    for (let i = 0; i < FETCH_MODES.length; i++) {
        const mode = FETCH_MODES[i]
        const session = new VixsrcSession(mode)
        try {
            const stream = await resolveWithSession(session, apiUrl, lang)
            await cache.set(cacheKey, stream, { ttl: CACHE_TTL_SECONDS })
            logger.info('Playlist VixSrc risolta', {
                tmdbId: input.tmdbId,
                type: input.type,
                videoId: stream.videoId,
                mode,
            })
            return stream
        } catch (error) {
            lastError = error instanceof Error ? error.message : lastError
            logger.warn('Transport VixSrc fallito', { mode, error: lastError, tmdbId: input.tmdbId })
        }
    }

    throw new Error(lastError)
}

async function resolveWithSession(session: VixsrcSession, apiUrl: string, lang: string): Promise<ResolvedVixsrcHls> {
    const src = parseVixsrcApiSrc(await session.fetchText(apiUrl))
    if (!src) {
        throw new Error('Risposta API VixSrc senza embed')
    }

    const embedUrl = new URL(src, VIXSRC_BASE_URL)
    if (embedUrl.origin !== new URL(VIXSRC_BASE_URL).origin) {
        throw new Error('Embed VixSrc su origin non attesa')
    }

    const embedHtml = await session.fetchText(embedUrl.toString())
    const parsed = parseVixsrcEmbedHtml(embedHtml) ?? parseVixsrcEmbedHtml(unwrapJinaBody(embedHtml))
    if (!parsed) {
        throw new Error('Playlist VixSrc non trovata nell\'embed')
    }

    const playlistUrl = buildVixsrcPlaylistUrl(parsed, lang)
    if (!isAllowedHlsUrl(playlistUrl)) {
        throw new Error('Playlist VixSrc su host non consentito')
    }

    return assembleBrowserStream(session, playlistUrl, parsed.videoId)
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

        const body = await session.fetchManifest(url)
        if (!keyUri) {
            const keyUrl = findKeyUrl(body, url)
            if (keyUrl) {
                const keyResponse = await session.fetch(keyUrl)
                if (!keyResponse.ok) {
                    throw new Error(`Chiave VixSrc non disponibile (${keyResponse.status})`)
                }
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
