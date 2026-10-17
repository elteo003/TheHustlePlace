import { getTVDetails, getOnTheAirTV, getTVVideos, findMainTrailer, TMDBTVDetails } from '@/lib/tmdb'
import { romeToday } from '@/lib/aired-episodes'

export interface UpcomingTVEpisode {
    season: number
    episode: number
    name: string
    overview: string
    airDate: string
    daysUntil: number
    formattedDate: string
    countdownBadge: string
    isAvailable: boolean
}

export interface UpcomingTVShowItem {
    id: number
    name: string
    overview: string
    backdropPath: string | null
    posterPath: string | null
    voteAverage: number
    genres: string[]
    isFollowed: boolean
    userProgress?: { season?: number; episode?: number }
    nextEpisode: UpcomingTVEpisode
    trailerKey?: string | null
}

const EXCLUDED_GENRES = new Set(['Talk', 'News', 'Reality'])

export function formatItalianAirDate(isoDate: string): string {
    const parts = isoDate.split('-').map(Number)
    if (parts.length < 3) return isoDate
    const [year, month, day] = parts
    const months = [
        'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
        'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ]
    const monthName = months[month - 1] ?? ''
    return `${day} ${monthName}`
}

export function computeDaysUntil(targetIso: string, todayIso = romeToday()): number {
    const d1 = new Date(todayIso + 'T00:00:00Z').getTime()
    const d2 = new Date(targetIso + 'T00:00:00Z').getTime()
    return Math.round((d2 - d1) / (1000 * 60 * 60 * 24))
}

export function formatCountdownBadge(daysUntil: number, formattedDate: string): string {
    if (daysUntil === 0) return 'In onda oggi'
    if (daysUntil === 1) return 'In onda domani'
    if (daysUntil > 1 && daysUntil <= 7) return `Tra ${daysUntil} giorni`
    if (daysUntil > 7) return `In arrivo il ${formattedDate}`
    return 'Disponibile ora'
}

function mapDetailsToUpcomingItem(
    details: TMDBTVDetails,
    isFollowed: boolean,
    userProgress?: { season?: number; episode?: number },
    today = romeToday()
): UpcomingTVShowItem | null {
    const next = details.next_episode_to_air
    if (!next || !next.air_date) return null

    const genres = details.genres?.map((g) => g.name) || []
    if (genres.some((g) => EXCLUDED_GENRES.has(g))) {
        return null
    }

    const daysUntil = computeDaysUntil(next.air_date, today)
    const formattedDate = formatItalianAirDate(next.air_date)
    const countdownBadge = formatCountdownBadge(daysUntil, formattedDate)

    return {
        id: details.id,
        name: details.name || details.original_name,
        overview: details.overview || next.overview || 'Nuovi episodi in arrivo prossimamente.',
        backdropPath: details.backdrop_path || next.still_path || null,
        posterPath: details.poster_path || null,
        voteAverage: details.vote_average ? Number(details.vote_average.toFixed(1)) : 8.0,
        genres: genres.filter((g) => !EXCLUDED_GENRES.has(g)).slice(0, 2),
        isFollowed,
        userProgress,
        nextEpisode: {
            season: next.season_number,
            episode: next.episode_number,
            name: next.name || `Episodio ${next.episode_number}`,
            overview: next.overview || '',
            airDate: next.air_date,
            daysUntil,
            formattedDate,
            countdownBadge,
            isAvailable: daysUntil <= 0,
        },
    }
}

export async function fetchUpcomingTVCatalog(
    followedSeries: Array<{ id: number; season?: number; episode?: number }> = []
): Promise<UpcomingTVShowItem[]> {
    const today = romeToday()
    const collected: UpcomingTVShowItem[] = []
    const seenIds = new Set<number>()

    // 1. Process followed series first
    for (const followed of followedSeries) {
        if (seenIds.has(followed.id)) continue
        try {
            const details = await getTVDetails(followed.id)
            const item = mapDetailsToUpcomingItem(details, true, {
                season: followed.season,
                episode: followed.episode,
            }, today)
            if (item) {
                seenIds.add(item.id)
                collected.push(item)
            }
        } catch {
            // ignore individual TMDB errors
        }
    }

    // 2. If fewer than 5 items, supplement from TMDB on_the_air
    if (collected.length < 5) {
        try {
            const onTheAir = await getOnTheAirTV()
            const candidates = (onTheAir.results || []).filter((show) => !seenIds.has(show.id))

            for (const candidate of candidates) {
                if (collected.length >= 5) break
                try {
                    const details = await getTVDetails(candidate.id)
                    const item = mapDetailsToUpcomingItem(details, false, undefined, today)
                    if (item && !seenIds.has(item.id)) {
                        seenIds.add(item.id)
                        collected.push(item)
                    }
                } catch {
                    // ignore
                }
            }
        } catch {
            // ignore
        }
    }

    // 3. Attach trailers for the top items
    const finalItems = await Promise.all(
        collected.slice(0, 5).map(async (item) => {
            try {
                const videos = await getTVVideos(item.id)
                const trailer = findMainTrailer(videos.results || [])
                return {
                    ...item,
                    trailerKey: trailer?.key ?? null,
                }
            } catch {
                return item
            }
        })
    )

    return finalItems
}
