import { Top10Content } from '@/types'
import { contentTmdbId } from '@/lib/vixsrc-ids'

export type TmdbMediaType = 'movie' | 'tv' | 'person'

export interface TmdbRailItem {
    id: number
    media_type?: TmdbMediaType | string
    title?: string
    name?: string
    original_title?: string
    original_name?: string
    overview?: string
    poster_path?: string | null
    backdrop_path?: string | null
    release_date?: string
    first_air_date?: string
    vote_average?: number
    vote_count?: number
    genre_ids?: number[]
    adult?: boolean
    original_language?: string
    popularity?: number
    video?: boolean
    origin_country?: string[]
}

export function isMovieOrTv(type: string | undefined): type is 'movie' | 'tv' {
    return type === 'movie' || type === 'tv'
}

export function mapTmdbItemToTop10(
    item: TmdbRailItem,
    fallbackType: 'movie' | 'tv' = 'movie'
): Top10Content | null {
    if (!item || !Number.isFinite(item.id) || item.id <= 0) {
        return null
    }

    const type = isMovieOrTv(item.media_type) ? item.media_type : fallbackType
    const title = (type === 'tv' ? item.name || item.title : item.title || item.name)?.trim()
    if (!title) {
        return null
    }

    return {
        id: item.id,
        title,
        name: item.name || title,
        overview: item.overview || '',
        poster_path: item.poster_path || undefined,
        backdrop_path: item.backdrop_path || undefined,
        release_date: item.release_date || item.first_air_date || '',
        first_air_date: item.first_air_date,
        vote_average: item.vote_average ?? 0,
        vote_count: item.vote_count ?? 0,
        genre_ids: item.genre_ids ?? [],
        adult: item.adult ?? false,
        original_language: item.original_language || '',
        original_title: item.original_title,
        original_name: item.original_name,
        popularity: item.popularity ?? 0,
        video: item.video,
        origin_country: item.origin_country,
        tmdb_id: item.id,
        type,
    }
}

export function takeGlobalTrending(items: TmdbRailItem[], limit = 10): Top10Content[] {
    const seen = new Set<string>()
    const result: Top10Content[] = []

    for (const item of items) {
        if (!isMovieOrTv(item.media_type)) {
            continue
        }

        const mapped = mapTmdbItemToTop10(item)
        if (!mapped) {
            continue
        }

        const key = `${mapped.type}:${mapped.id}`
        if (seen.has(key)) {
            continue
        }

        seen.add(key)
        result.push(mapped)
        if (result.length >= limit) {
            break
        }
    }

    return result
}

export function comingSoonReleaseDate(item: Top10Content): string {
    return item.type === 'tv'
        ? item.first_air_date || item.release_date || ''
        : item.release_date || item.first_air_date || ''
}

export function mergeComingSoon(
    groups: Array<{ items: TmdbRailItem[]; type: 'movie' | 'tv' }>
): Top10Content[] {
    const seen = new Set<string>()
    const result: Top10Content[] = []

    for (const { items, type } of groups) {
        for (const item of items) {
            const mapped = mapTmdbItemToTop10(
                { ...item, media_type: item.media_type || type },
                type
            )
            if (!mapped) {
                continue
            }

            const key = `${mapped.type}:${mapped.id}`
            if (seen.has(key)) {
                continue
            }

            seen.add(key)
            result.push(mapped)
        }
    }

    return result
}

export function sortComingSoonByDate(items: Top10Content[]): Top10Content[] {
    return [...items].sort((left, right) =>
        comingSoonReleaseDate(left).localeCompare(comingSoonReleaseDate(right))
    )
}

export function keepFutureReleases(items: Top10Content[], from: string): Top10Content[] {
    return items.filter((item) => {
        const date = comingSoonReleaseDate(item)
        return Boolean(date) && date >= from
    })
}

export function keepNotableComingSoon(items: Top10Content[], minPopularity = 10): Top10Content[] {
    return items.filter((item) => (item.popularity ?? 0) >= minPopularity)
}

export function keepCinemaReleases(items: Top10Content[], minPopularity = 8): Top10Content[] {
    return items.filter((item) => {
        if (item.type === 'tv') return false
        if (!item.poster_path) return false
        return (item.popularity ?? 0) >= minPopularity
    })
}

export function excludeAvailableOnVixsrc<T extends { id: number; tmdb_id?: number; type?: 'movie' | 'tv' }>(
    items: T[],
    movieIds: Set<number>,
    tvIds: Set<number>
): T[] {
    return items.filter((item) => {
        const id = contentTmdbId(item)
        const pool = item.type === 'tv' ? tvIds : movieIds
        if (pool.size === 0) {
            return true
        }
        return !pool.has(id)
    })
}

export function isoDateOnly(date: Date): string {
    return date.toISOString().slice(0, 10)
}

export function comingSoonWindow(now = new Date(), days = 90): { from: string; to: string } {
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const to = new Date(from)
    to.setUTCDate(to.getUTCDate() + days)
    return { from: isoDateOnly(from), to: isoDateOnly(to) }
}

/** Theatrical limited (2) and theatrical (3). */
export const THEATRICAL_RELEASE_TYPES = '2|3'

export function cinemaYearWindow(now = new Date()): { from: string; to: string } {
    const from = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Rome',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(now)
    return { from, to: `${from.slice(0, 4)}-12-31` }
}
