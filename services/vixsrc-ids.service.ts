import axios from 'axios'
import { cache } from '@/utils/cache'
import { logger } from '@/utils/logger'

const VIXSRC_BASE_URL = process.env.VIXSRC_BASE_URL || 'https://vixsrc.to'
const CACHE_TTL = 3600

type VixsrcListType = 'movie' | 'tv'

async function fetchIdList(type: VixsrcListType): Promise<number[]> {
    const cacheKey = `vixsrc-ids-${type}`
    const cached = await cache.get<number[]>(cacheKey)
    if (cached) {
        return cached
    }

    const response = await axios.get(`${VIXSRC_BASE_URL}/api/list/${type}?lang=it`, {
        timeout: 20000,
    })

    const ids = Array.isArray(response.data)
        ? response.data
              .map((item: { tmdb_id?: unknown }) => item?.tmdb_id)
              .filter((id: unknown): id is number => typeof id === 'number' && Number.isFinite(id))
        : []

    await cache.set(cacheKey, ids, { ttl: CACHE_TTL })
    logger.info('Lista ID VixSrc in cache', { type, count: ids.length })
    return ids
}

export async function getVixsrcIdSet(type: VixsrcListType): Promise<Set<number>> {
    try {
        const ids = await fetchIdList(type)
        return new Set(ids)
    } catch (error) {
        logger.warn('Impossibile caricare la lista VixSrc, nessun filtro disponibilità', { type, error })
        return new Set()
    }
}

export async function isOnVixsrc(tmdbId: number, type: VixsrcListType): Promise<boolean> {
    const ids = await getVixsrcIdSet(type)
    if (ids.size === 0) {
        return false
    }
    return ids.has(tmdbId)
}
