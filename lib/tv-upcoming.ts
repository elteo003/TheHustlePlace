import {
    getTVDetails,
    getOnTheAirTV,
    discoverUpcomingTV,
    getTVVideos,
    findMainTrailer,
    TMDBTVDetails,
} from '@/lib/tmdb'
import { romeToday } from '@/lib/aired-episodes'
import { toDiscoverGenres, genrePipe } from '@/lib/personal-rails'

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

export interface FetchUpcomingTVOptions {
    topGenres?: number[]
    today?: string
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
    if (!targetIso) return 999
    const d1 = new Date(todayIso + 'T00:00:00Z').getTime()
    const d2 = new Date(targetIso + 'T00:00:00Z').getTime()
    return Math.round((d2 - d1) / (1000 * 60 * 60 * 24))
}

export function formatCountdownBadge(daysUntil: number, formattedDate: string): string {
    if (daysUntil >= 900) return 'Nuova stagione confermata'
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
    const genres = details.genres?.map((g) => g.name) || []
    if (genres.some((g) => EXCLUDED_GENRES.has(g))) {
        return null
    }

    let airDate: string | null = null
    let seasonNum = 1
    let episodeNum = 1
    let episodeName = ''
    let episodeOverview = ''

    if (details.next_episode_to_air?.air_date) {
        airDate = details.next_episode_to_air.air_date
        seasonNum = details.next_episode_to_air.season_number
        episodeNum = details.next_episode_to_air.episode_number
        episodeName = details.next_episode_to_air.name || `Episodio ${episodeNum}`
        episodeOverview = details.next_episode_to_air.overview || ''
    } else if (details.seasons?.length) {
        const futureSeasons = details.seasons
            .filter((s) => s.season_number > 0 && s.air_date && s.air_date >= today)
            .sort((a, b) => (a.air_date! > b.air_date! ? 1 : -1))
        const targetSeason = futureSeasons[0]
        if (targetSeason?.air_date) {
            airDate = targetSeason.air_date
            seasonNum = targetSeason.season_number
            episodeNum = 1
            episodeName = targetSeason.name || `Stagione ${seasonNum}`
            episodeOverview = targetSeason.overview || ''
        }
    }

    // Se seguita e confermata per il ritorno, accetta anche con data da annunciare
    const isReturning = details.status === 'Returning Series' || details.status === 'In Production'
    if (!airDate) {
        if (!isFollowed || !isReturning) {
            return null
        }
        seasonNum = (details.number_of_seasons || 1) + 1
        episodeNum = 1
        episodeName = 'Nuova stagione'
        episodeOverview = 'Nuova stagione confermata in arrivo prossimamente.'
    }

    const daysUntil = airDate ? computeDaysUntil(airDate, today) : 999
    const formattedDate = airDate ? formatItalianAirDate(airDate) : 'Data da annunciare'
    const countdownBadge = formatCountdownBadge(daysUntil, formattedDate)

    return {
        id: details.id,
        name: details.name || details.original_name,
        overview: details.overview || episodeOverview || 'Nuovi episodi in arrivo prossimamente.',
        backdropPath: details.backdrop_path || details.next_episode_to_air?.still_path || null,
        posterPath: details.poster_path || null,
        voteAverage: details.vote_average ? Number(details.vote_average.toFixed(1)) : 8.0,
        genres: genres.filter((g) => !EXCLUDED_GENRES.has(g)).slice(0, 2),
        isFollowed,
        userProgress,
        nextEpisode: {
            season: seasonNum,
            episode: episodeNum,
            name: episodeName,
            overview: episodeOverview,
            airDate: airDate || '',
            daysUntil,
            formattedDate,
            countdownBadge,
            isAvailable: airDate ? daysUntil <= 0 : false,
        },
    }
}

export async function fetchUpcomingTVCatalog(
    followedSeries: Array<{ id: number; season?: number; episode?: number }> = [],
    options?: FetchUpcomingTVOptions
): Promise<UpcomingTVShowItem[]> {
    const today = options?.today ?? romeToday()
    const collected: UpcomingTVShowItem[] = []
    const seenIds = new Set<number>()

    // 1. Elabora prima le serie seguite dall'utente
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

    // 2. Se meno di 5 elementi, integra usando il motore di affinità / gusti utente
    if (collected.length < 5) {
        const targetGenres = options?.topGenres?.length
            ? toDiscoverGenres(options.topGenres, 'tv')
            : []
        const userGenreSet = new Set(targetGenres)
        const candidateMap = new Map<number, { id: number; affinityScore: number }>()

        // 2a. Cerca serie in arrivo con i generi preferiti dell'utente
        if (targetGenres.length > 0) {
            try {
                const discovered = await discoverUpcomingTV({
                    withGenres: genrePipe(targetGenres),
                    airDateGte: today,
                })
                for (const show of discovered.results || []) {
                    if (seenIds.has(show.id)) continue
                    let score = (show.vote_average || 7) * 2
                    const matching = (show.genre_ids || []).filter((g) => userGenreSet.has(g)).length
                    score += matching * 15
                    candidateMap.set(show.id, { id: show.id, affinityScore: score })
                }
            } catch {
                // ignore
            }
        }

        // 2b. Pool on_the_air generale (anch'esso ordinato e pesato per affinità)
        try {
            const onTheAir = await getOnTheAirTV()
            for (const show of onTheAir.results || []) {
                if (seenIds.has(show.id)) continue
                const existing = candidateMap.get(show.id)
                let score = (show.vote_average || 7) * 2
                const matching = (show.genre_ids || []).filter((g) => userGenreSet.has(g)).length
                score += matching * 15
                if (!existing || score > existing.affinityScore) {
                    candidateMap.set(show.id, { id: show.id, affinityScore: score })
                }
            }
        } catch {
            // ignore
        }

        // Ordina i candidati per punteggio di affinità decrescente
        const sortedCandidates = Array.from(candidateMap.values()).sort(
            (a, b) => b.affinityScore - a.affinityScore
        )

        for (const candidate of sortedCandidates) {
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
    }

    // 3. Allega trailer per gli elementi finali
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
