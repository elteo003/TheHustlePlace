import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockDiscoverTVShows = vi.fn()
const mockDiscoverMovies = vi.fn()

vi.mock('@/services/tmdb-wrapper.service', () => ({
    tmdbWrapperService: {
        discoverTVShows: (...args: unknown[]) => mockDiscoverTVShows(...args),
        discoverMovies: (...args: unknown[]) => mockDiscoverMovies(...args),
    },
}))

vi.mock('@/utils/cache', () => ({
    cache: {
        get: async () => null,
        set: async () => {},
        generateKey: (prefix: string, params: unknown) => `${prefix}:${JSON.stringify(params)}`,
    },
}))

import { CatalogService } from '@/services/catalog.service'

describe('CatalogService - Recent TV and Movies image & date filtering', () => {
    let service: CatalogService

    beforeEach(() => {
        service = new CatalogService()
        mockDiscoverTVShows.mockReset()
        mockDiscoverMovies.mockReset()
    })

    it('getLatestTVShows impone first_air_date.lte e vote_count.gte ed esclude elementi senza poster', async () => {
        mockDiscoverTVShows.mockResolvedValue({
            page: 1,
            total_pages: 1,
            total_results: 3,
            results: [
                {
                    id: 101,
                    name: 'Serie Valida Con Poster',
                    first_air_date: '2026-11-18',
                    poster_path: '/valid_poster.jpg',
                    backdrop_path: '/valid_backdrop.jpg',
                    vote_count: 10,
                },
                {
                    id: 102,
                    name: 'Serie Fantasma Senza Poster',
                    first_air_date: '2026-11-20',
                    poster_path: null,
                    backdrop_path: null,
                    vote_count: 0,
                },
                {
                    id: 103,
                    name: 'Serie Futura Senza Poster',
                    first_air_date: '2043-01-01',
                    poster_path: '',
                    backdrop_path: null,
                    vote_count: 0,
                },
            ],
        })

        const res = await service.getLatestTVShows(1)

        // Verifica i parametri inviati a TMDB discover
        expect(mockDiscoverTVShows).toHaveBeenCalledTimes(1)
        const callParams = mockDiscoverTVShows.mock.calls[0][0]
        expect(callParams.sort_by).toBe('first_air_date.desc')
        expect(callParams['first_air_date.lte']).toBeDefined()
        expect(callParams['first_air_date.lte']).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(callParams['vote_count.gte']).toBe(2)

        // Verifica che solo la serie con poster valido sia sopravvissuta al filtro
        expect(res.results).toHaveLength(1)
        expect(res.results[0].id).toBe(101)
        expect(res.results[0].name).toBe('Serie Valida Con Poster')
        expect(res.results[0].poster_path).toBe('/valid_poster.jpg')
    })

    it('getLatestMovies impone primary_release_date.lte e vote_count.gte ed esclude film senza poster', async () => {
        mockDiscoverMovies.mockResolvedValue({
            page: 1,
            total_pages: 1,
            total_results: 3,
            results: [
                {
                    id: 201,
                    title: 'Film Valido Con Poster',
                    release_date: '2026-11-18',
                    poster_path: '/film_poster.jpg',
                    backdrop_path: '/film_backdrop.jpg',
                    vote_count: 15,
                },
                {
                    id: 202,
                    title: 'Film Fantasma Senza Poster',
                    release_date: '2026-11-20',
                    poster_path: null,
                    backdrop_path: null,
                    vote_count: 0,
                },
            ],
        })

        const res = await service.getLatestMovies(1)

        expect(mockDiscoverMovies).toHaveBeenCalledTimes(1)
        const callParams = mockDiscoverMovies.mock.calls[0][0]
        expect(callParams.sort_by).toBe('primary_release_date.desc')
        expect(callParams['primary_release_date.lte']).toBeDefined()
        expect(callParams['primary_release_date.lte']).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(callParams['vote_count.gte']).toBe(2)

        expect(res.results).toHaveLength(1)
        expect(res.results[0].id).toBe(201)
        expect(res.results[0].title).toBe('Film Valido Con Poster')
    })
})
