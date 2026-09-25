import { logger } from '@/utils/logger'
import { checkTailAvailability, EpisodeRef } from './episode-availability.service'
import { isOnVixsrc } from './vixsrc-ids.service'

export type { EpisodeRef }

export interface EpisodeAvailability extends EpisodeRef {
    available: boolean
}

export interface EpisodeAvailabilityBatch {
    showListed: boolean | null
    availability: EpisodeAvailability[]
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
): Promise<EpisodeAvailabilityBatch> {
    return checkTailAvailability(tmdbId, episodes)
}
