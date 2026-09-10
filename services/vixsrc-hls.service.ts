import { cache } from '@/utils/cache'
import { logger } from '@/utils/logger'
import {
    buildVixsrcPlaylistUrl,
    isAllowedHlsUrl,
    parseVixsrcEmbedHtml,
} from '@/lib/vixsrc-hls'

export interface ResolvedVixsrcHls {
    playlistUrl: string
    videoId?: number
}

const VIXSRC_BASE_URL = process.env.VIXSRC_BASE_URL || 'https://vixsrc.to'
const CACHE_TTL_SECONDS = 300
const BROWSER_UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

export const VIXSRC_FETCH_HEADERS = {
    'User-Agent': BROWSER_UA,
    Referer: `${VIXSRC_BASE_URL}/`,
    Origin: VIXSRC_BASE_URL,
} as const

export function vixsrcRequestHeaders(extra?: HeadersInit): Headers {
    const headers = new Headers(VIXSRC_FETCH_HEADERS)
    if (extra) {
        new Headers(extra).forEach((value, key) => headers.set(key, value))
    }
    return headers
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
    if (cached) return cached

    const apiPath =
        input.type === 'movie'
            ? `/api/movie/${input.tmdbId}?lang=${encodeURIComponent(lang)}`
            : `/api/tv/${input.tmdbId}/${input.season}/${input.episode}?lang=${encodeURIComponent(lang)}`

    const apiResponse = await fetch(`${VIXSRC_BASE_URL}${apiPath}`, {
        headers: vixsrcRequestHeaders({ Accept: 'application/json' }),
        cache: 'no-store',
    })
    if (!apiResponse.ok) {
        throw new Error(`API VixSrc non disponibile (${apiResponse.status})`)
    }

    const apiJson = (await apiResponse.json()) as { src?: unknown }
    if (typeof apiJson.src !== 'string' || !apiJson.src.startsWith('/')) {
        throw new Error('Risposta API VixSrc senza embed')
    }

    const embedUrl = new URL(apiJson.src, VIXSRC_BASE_URL)
    if (embedUrl.origin !== new URL(VIXSRC_BASE_URL).origin) {
        throw new Error('Embed VixSrc su origin non attesa')
    }

    const embedResponse = await fetch(embedUrl.toString(), {
        headers: vixsrcRequestHeaders({ Accept: 'text/html' }),
        cache: 'no-store',
    })
    if (!embedResponse.ok) {
        throw new Error(`Embed VixSrc non disponibile (${embedResponse.status})`)
    }

    const parsed = parseVixsrcEmbedHtml(await embedResponse.text())
    if (!parsed) {
        throw new Error('Playlist VixSrc non trovata nell\'embed')
    }

    const playlistUrl = buildVixsrcPlaylistUrl(parsed, lang)
    if (!isAllowedHlsUrl(playlistUrl)) {
        throw new Error('Playlist VixSrc su host non consentito')
    }

    const resolved = { playlistUrl, videoId: parsed.videoId }
    await cache.set(cacheKey, resolved, { ttl: CACHE_TTL_SECONDS })
    logger.info('Playlist VixSrc risolta', { tmdbId: input.tmdbId, type: input.type, videoId: parsed.videoId })
    return resolved
}
