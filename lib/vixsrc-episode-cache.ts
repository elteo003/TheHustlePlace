import { cache } from '@/utils/cache'

const HIT_TTL_SECONDS = 6 * 60 * 60
const MISS_TTL_SECONDS = 2 * 60 * 60

export function vixsrcEpisodeCacheKey(tmdbId: number, season: number, episode: number): string {
    return `vixsrc-ep:${tmdbId}:${season}:${episode}`
}

export async function readVixsrcEpisodeAvailability(
    tmdbId: number,
    season: number,
    episode: number
): Promise<boolean | null> {
    const value = await cache.get<boolean>(vixsrcEpisodeCacheKey(tmdbId, season, episode))
    return value === true || value === false ? value : null
}

export async function rememberVixsrcEpisodeAvailability(
    tmdbId: number,
    season: number,
    episode: number,
    available: boolean
): Promise<void> {
    await cache.set(vixsrcEpisodeCacheKey(tmdbId, season, episode), available, {
        ttl: available ? HIT_TTL_SECONDS : MISS_TTL_SECONDS,
    })
}
