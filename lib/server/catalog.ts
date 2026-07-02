import { CatalogService } from '@/services/catalog.service'
import { Movie, TVShow, Top10Content } from '@/types'

const catalogService = new CatalogService()

import { CatalogSection } from '@/lib/catalog-types'
export async function fetchCatalogSection(
    type: 'movie' | 'tv',
    section: CatalogSection,
    limit = 10
): Promise<(Movie | TVShow | Top10Content)[]> {
    let results: (Movie | TVShow | Top10Content)[] = []

    switch (section) {
        case 'trending': {
            const top10 = await catalogService.getTop10Mixed()
            results = top10.map((item) => ({
                ...item,
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
