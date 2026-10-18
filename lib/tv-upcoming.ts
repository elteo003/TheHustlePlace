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
    rejectedIds?: number[]
    lovedIds?: number[]
    today?: string
}

const EXCLUDED_GENRES = new Set(['Talk', 'News', 'Reality', 'Soap'])
const EXCLUDED_GENRE_IDS = '10767,10763,10764,10766'

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

export function mapDetailsToUpcomingItem(
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
        const nextAir = details.next_episode_to_air.air_date
        if (nextAir >= today) {
            airDate = nextAir
            seasonNum = details.next_episode_to_air.season_number
            episodeNum = details.next_episode_to_air.episode_number
            episodeName = details.next_episode_to_air.name || `Episodio ${episodeNum}`
            episodeOverview = details.next_episode_to_air.overview || ''
        }
    }

    if (!airDate && details.seasons?.length) {
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

    if (!airDate && details.first_air_date && details.first_air_date >= today) {
        airDate = details.first_air_date
        seasonNum = 1
        episodeNum = 1
        episodeName = 'Episodio 1'
        episodeOverview = details.overview || ''
    }

    // Se non ci sono episodi o stagioni con data certa >= today, NON mostrare.
    // Non vengono più mostrate serie generiche "confermate" senza una data di uscita programmata.
    if (!airDate) {
        return null
    }

    const daysUntil = computeDaysUntil(airDate, today)
    if (daysUntil < 0) {
        return null
    }

    const formattedDate = formatItalianAirDate(airDate)
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
            airDate,
            daysUntil,
            formattedDate,
            countdownBadge,
            isAvailable: daysUntil <= 0,
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
    const rejectedSet = new Set(options?.rejectedIds || [])

    // 1. Elabora prima le serie seguite/iniziate dall'utente con nuove puntate in uscita
    for (const followed of followedSeries) {
        if (seenIds.has(followed.id) || rejectedSet.has(followed.id)) continue
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

        const addCandidates = (shows: any[], isUserGenreTargeted: boolean) => {
            for (const show of shows || []) {
                if (seenIds.has(show.id) || rejectedSet.has(show.id)) continue
                let score = (show.vote_average || 7) * 2 + Math.log10((show.popularity || 1) + 1) * 3
                const matching = (show.genre_ids || []).filter((g: number) => userGenreSet.has(g)).length
                score += matching * 25
                if (isUserGenreTargeted) score += 20
                if (options?.lovedIds?.includes(show.id)) score += 50
                const existing = candidateMap.get(show.id)
                if (!existing || score > existing.affinityScore) {
                    candidateMap.set(show.id, { id: show.id, affinityScore: score })
                }
            }
        }

        // 2a. Se l'utente ha generi preferiti, cerca serie nuove ed episodi in arrivo con i suoi generi
        if (targetGenres.length > 0) {
            try {
                const [newDebuts, upcomingEpisodes] = await Promise.all([
                    discoverUpcomingTV({
                        withGenres: genrePipe(targetGenres),
                        withoutGenres: EXCLUDED_GENRE_IDS,
                        firstAirDateGte: today,
                    }),
                    discoverUpcomingTV({
                        withGenres: genrePipe(targetGenres),
                        withoutGenres: EXCLUDED_GENRE_IDS,
                        airDateGte: today,
                    }),
                ])
                addCandidates(newDebuts.results, true)
                addCandidates(upcomingEpisodes.results, true)
            } catch {
                // ignore
            }
        }

        // 2b. Pool generale serie in arrivo (nuovi debutti e nuovi episodi) per completare con affinità
        try {
            const [generalDebuts, generalUpcoming] = await Promise.all([
                discoverUpcomingTV({
                    withoutGenres: EXCLUDED_GENRE_IDS,
                    firstAirDateGte: today,
                }),
                discoverUpcomingTV({
                    withoutGenres: EXCLUDED_GENRE_IDS,
                    airDateGte: today,
                }),
            ])
            addCandidates(generalDebuts.results, false)
            addCandidates(generalUpcoming.results, false)
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
