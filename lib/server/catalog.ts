import { CatalogService } from '@/services/catalog.service'
import { Movie, TVShow, Top10Content } from '@/types'
import { CatalogSection, HOME_RAIL_SIZE } from '@/lib/catalog-types'
import { cookies } from 'next/headers'
import { listWatchHistory, isDatabaseConfigured } from '@/lib/db/watch-history'
import { DEVICE_COOKIE, isDeviceId } from '@/lib/supabase/device'
import { HistorySeed, PersonalRails } from '@/lib/personal-rails'
import { EditorialRails, EDITORIAL_RAIL_SIZE } from '@/lib/editorial-rails'

const catalogService = new CatalogService()

export async function fetchServerWatchHistory(): Promise<HistorySeed[]> {
    if (!isDatabaseConfigured()) {
        return []
    }

    const store = await cookies()
    const deviceId = store.get(DEVICE_COOKIE)?.value
    if (!isDeviceId(deviceId)) {
        return []
    }

    try {
        const entries = await listWatchHistory(deviceId)
        return entries.map((entry) => ({
            id: entry.id,
            type: entry.type,
            progress: entry.progress,
            watchedAt: entry.watchedAt,
        }))
    } catch {
        return []
    }
}

export async function fetchPersonalRails(
    occupied: Array<{ id: number; type?: 'movie' | 'tv' }> = [],
    history?: HistorySeed[]
): Promise<PersonalRails> {
    const seeds = history ?? (await fetchServerWatchHistory())
    return catalogService.getPersonalRails(seeds, occupied, HOME_RAIL_SIZE)
}

export async function fetchEditorialRails(
    occupied: Array<{ id: number; type?: 'movie' | 'tv' }> = []
): Promise<EditorialRails> {
    return catalogService.getEditorialRails(occupied, EDITORIAL_RAIL_SIZE)
}

export async function fetchCatalogSection(
    type: 'movie' | 'tv',
    section: CatalogSection,
    limit = HOME_RAIL_SIZE
): Promise<(Movie | TVShow | Top10Content)[]> {
    let results: (Movie | TVShow | Top10Content)[] = []

    switch (section) {
        case 'trending': {
            const top10 = await catalogService.getTop10Mixed()
            results = top10.map((item) => ({
                ...item,
                title: item.title || item.name,
                name: item.name || item.title,
                contentType: item.type,
                tmdb_id: item.tmdb_id ?? item.id,
            })) as Top10Content[]
            break
        }
        case 'upcoming': {
            const comingSoon = await catalogService.getComingSoon(Math.max(limit, 20))
            results = comingSoon.map((item) => ({
                ...item,
                title: item.title || item.name,
                name: item.name || item.title,
                contentType: item.type,
                tmdb_id: item.tmdb_id ?? item.id,
            })) as Top10Content[]
            break
        }
        case 'now-playing':
            results = await catalogService.getNowPlayingMovies()
            break
        case 'popular':
            if (type === 'movie') {
                results = await catalogService.getPopularMovies()
            } else {
                const response = await catalogService.getPopularTVShows(1)
                results = response.results
            }
            break
        case 'recent':
            if (type === 'movie') {
                const response = await catalogService.getLatestMovies(1)
                results = response.results
            } else {
                const response = await catalogService.getLatestTVShows(1)
                results = response.results
            }
            break
        case 'top-rated':
            if (type === 'movie') {
                const response = await catalogService.getTopRatedMovies(1)
                results = response.results
            } else {
                const response = await catalogService.getTopRatedTVShows(1)
                results = response.results
            }
            break
        case 'picks':
        case 'affinity':
        case 'treasures':
        case 'war-politics':
        case 'medieval-passion':
        case 'puzzle-investigations':
        case 'mystery-masterpieces':
        case 'darkest-horror':
        case 'jukebox-pop-stars':
        case 'vintage-stories':
        case 'drug-empires':
        case 'crime-lords':
        case 'political-intrigue':
        case 'period-stories':
            results = []
            break
    }

    return results.slice(0, limit)
}

export async function fetchCatalogMoviesPage(page = 1) {
    return catalogService.getMovies({ page })
}

export async function fetchCatalogTVPage(page = 1) {
    return catalogService.getTVShows({ page })
}

export async function fetchSearchResults(query: string) {
    const trimmed = query.trim()
    if (!trimmed) {
        return {
            movies: [] as Movie[],
            tvShows: [] as TVShow[],
            totalMovies: 0,
            totalTVShows: 0,
        }
    }

    const [moviesPage, tvPage] = await Promise.all([
        catalogService.searchMovies(trimmed, 1),
        catalogService.searchTVShows(trimmed, 1),
    ])

    return {
        movies: moviesPage.results,
        tvShows: tvPage.results,
        totalMovies: moviesPage.total_results,
        totalTVShows: tvPage.total_results,
    }
}
