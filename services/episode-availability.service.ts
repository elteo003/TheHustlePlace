import { classifyVixsrcEpisodeProbe, EpisodeProbeResult } from '@/lib/vixsrc-episode-status'
import { readVixsrcEpisodeAvailability, rememberVixsrcEpisodeAvailability } from '@/lib/vixsrc-episode-cache'
import { logger } from '@/utils/logger'
import { getVixsrcListStatus } from './vixsrc-ids.service'

const VIXSRC_BASE_URL = process.env.VIXSRC_BASE_URL || 'https://vixsrc.to'
const PROBE_TIMEOUT_MS = 2000
const PROBE_CONCURRENCY = 2
const MAX_PROBES = 20

const PROBE_HEADERS = {
    Accept: 'application/json,text/plain,*/*',
    'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
}

export interface EpisodeRef {
    season: number
    episode: number
}

export interface TailAvailability {
    showListed: boolean | null
    availability: Array<EpisodeRef & { available: boolean }>
}

async function probeEpisode(tmdbId: number, season: number, episode: number): Promise<EpisodeProbeResult> {
    const cached = await readVixsrcEpisodeAvailability(tmdbId, season, episode)
    if (cached === true) return 'available'
    if (cached === false) return 'missing'

    const url = `${VIXSRC_BASE_URL}/api/tv/${tmdbId}/${season}/${episode}?lang=it`
    try {
        const response = await fetch(url, {
            headers: PROBE_HEADERS,
            cache: 'no-store',
            signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
        })
        const body = response.status === 403 || response.status === 404 ? '' : await response.text()
        const result = classifyVixsrcEpisodeProbe(response.status, body)
        if (result === 'available') await rememberVixsrcEpisodeAvailability(tmdbId, season, episode, true)
        if (result === 'missing') await rememberVixsrcEpisodeAvailability(tmdbId, season, episode, false)
        return result
    } catch (error) {
        logger.warn('Probe episodio VixSrc senza esito', { tmdbId, season, episode, error })
        return 'unknown'
    }
}

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
    const results = new Array<R>(items.length)
    let cursor = 0
    const worker = async () => {
        while (cursor < items.length) {
            const index = cursor
            cursor += 1
            results[index] = await fn(items[index])
        }
    }
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()))
    return results
}

export async function checkTailAvailability(tmdbId: number, episodes: EpisodeRef[]): Promise<TailAvailability> {
    const list = await getVixsrcListStatus('tv')
    if (!list.loaded) {
        return {
            showListed: null,
            availability: episodes.map((episode) => ({ ...episode, available: true })),
        }
    }
    if (!list.ids.has(tmdbId)) {
        return {
            showListed: false,
            availability: episodes.map((episode) => ({ ...episode, available: false })),
        }
    }

    const probed = episodes.slice(0, MAX_PROBES)
    const availability = await mapPool(probed, PROBE_CONCURRENCY, async (episode) => {
        const result = await probeEpisode(tmdbId, episode.season, episode.episode)
        return {
            ...episode,
            available: result !== 'missing',
        }
    })
    const skipped = episodes.slice(MAX_PROBES).map((episode) => ({ ...episode, available: true }))

    return { showListed: true, availability: [...availability, ...skipped] }
}
