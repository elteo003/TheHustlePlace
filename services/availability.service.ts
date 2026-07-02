import { logger } from '@/utils/logger'

const VIXSRC_BASE_URL = process.env.VIXSRC_BASE_URL || 'https://vixsrc.to'
const BATCH_CONCURRENCY = 8

export interface EpisodeRef {
    season: number
    episode: number
}

export interface EpisodeAvailability extends EpisodeRef {
    available: boolean
}

function buildVixsrcUrl(tmdbId: number, type: 'movie' | 'tv', season?: number, episode?: number): string {
    if (type === 'movie') {
        return `${VIXSRC_BASE_URL}/movie/${tmdbId}`
    }
    return `${VIXSRC_BASE_URL}/tv/${tmdbId}/${season ?? 1}/${episode ?? 1}`
}

export async function checkVixsrcAvailability(
    tmdbId: number,
    type: 'movie' | 'tv',
    season?: number,
    episode?: number
): Promise<boolean> {
    const vixsrcUrl = buildVixsrcUrl(tmdbId, type, season, episode)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
        const response = await fetch(vixsrcUrl, {
            method: 'GET',
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                Range: 'bytes=0-1023',
            },
            signal: controller.signal,
        })

        return response.status === 200 || response.status === 206 || response.status === 416
    } catch (error) {
        logger.warn('Disponibilità VixSrc non verificabile', { tmdbId, type, season, episode, error })
        return false
    } finally {
        clearTimeout(timeoutId)
    }
}

export async function checkEpisodesAvailability(
    tmdbId: number,
    episodes: EpisodeRef[]
): Promise<EpisodeAvailability[]> {
    const results: EpisodeAvailability[] = []

    for (let i = 0; i < episodes.length; i += BATCH_CONCURRENCY) {
        const batch = episodes.slice(i, i + BATCH_CONCURRENCY)
        const batchResults = await Promise.all(
            batch.map(async ({ season, episode }) => ({
                season,
                episode,
                available: await checkVixsrcAvailability(tmdbId, 'tv', season, episode),
            }))
        )
        results.push(...batchResults)
    }

    return results
}
