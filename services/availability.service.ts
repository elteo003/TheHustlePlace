import { logger } from '@/utils/logger'
import { isOnVixsrc } from './vixsrc-ids.service'

const BATCH_CONCURRENCY = 8

export interface EpisodeRef {
    season: number
    episode: number
}

export interface EpisodeAvailability extends EpisodeRef {
    available: boolean
}

export async function checkVixsrcAvailability(
    tmdbId: number,
    type: 'movie' | 'tv',
    _season?: number,
    _episode?: number
): Promise<boolean> {
    try {
        return await isOnVixsrc(tmdbId, type)
    } catch (error) {
        logger.warn('Disponibilità VixSrc non verificabile', { tmdbId, type, error })
        return false
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
