import { NextRequest, NextResponse } from 'next/server'
import { CatalogService } from '@/services/catalog.service'
import { ValidationMiddleware, validationSchemas } from '@/middlewares/validation.middleware'
import { logger } from '@/utils/logger'

export class CatalogController {
    private catalogService: CatalogService

    constructor() {
        this.catalogService = new CatalogService()
    }

    async getMovies(request: NextRequest): Promise<NextResponse> {
        try {
            // Parse query parameters manually for now
            const url = new URL(request.url)
            const filters = {
                genre: url.searchParams.get('genre') ? parseInt(url.searchParams.get('genre')!) : undefined,
                year: url.searchParams.get('year') ? parseInt(url.searchParams.get('year')!) : undefined,
                language: url.searchParams.get('language') || undefined,
                sortBy: url.searchParams.get('sortBy') as 'popularity' | 'vote_average' | 'release_date' | 'title' || undefined,
                sortOrder: url.searchParams.get('sortOrder') as 'asc' | 'desc' || undefined,
                page: url.searchParams.get('page') ? parseInt(url.searchParams.get('page')!) : 1
            }
            const movies = await this.catalogService.getMovies(filters)

            return NextResponse.json({
                success: true,
                data: movies,
                message: 'Film recuperati con successo'
            })
        } catch (error) {
            logger.error('Errore nel recupero film', { error })

            return NextResponse.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : 'Errore interno del server'
                },
                { status: 500 }
            )
        }
    }

    async getTVShows(request: NextRequest): Promise<NextResponse> {
        try {
            // Parse query parameters manually for now
            const url = new URL(request.url)
            const filters = {
                genre: url.searchParams.get('genre') ? parseInt(url.searchParams.get('genre')!) : undefined,
                year: url.searchParams.get('year') ? parseInt(url.searchParams.get('year')!) : undefined,
                language: url.searchParams.get('language') || undefined,
                sortBy: url.searchParams.get('sortBy') as 'popularity' | 'vote_average' | 'release_date' | 'title' || undefined,
                sortOrder: url.searchParams.get('sortOrder') as 'asc' | 'desc' || undefined,
                page: url.searchParams.get('page') ? parseInt(url.searchParams.get('page')!) : 1
            }
            const tvShows = await this.catalogService.getTVShows(filters)

            return NextResponse.json({
                success: true,
                data: tvShows,
                message: 'Serie TV recuperate con successo'
            })
        } catch (error) {
            logger.error('Errore nel recupero serie TV', { error })

            return NextResponse.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : 'Errore interno del server'
                },
                { status: 500 }
            )
        }
    }



    async getPopularTVShows(request: NextRequest): Promise<NextResponse> {
        try {
            const url = new URL(request.url)
            const page = parseInt(url.searchParams.get('page') || '1')

            const tvShows = await this.catalogService.getPopularTVShows(page)

            return NextResponse.json({
                success: true,
                data: tvShows,
                message: 'Serie TV popolari recuperate con successo'
            })
        } catch (error) {
            logger.error('Errore nel recupero serie TV popolari', { error })

            return NextResponse.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : 'Errore interno del server'
                },
                { status: 500 }
            )
        }
    }

    async getLatestMovies(request: NextRequest): Promise<NextResponse> {
        try {
            const url = new URL(request.url)
            const page = parseInt(url.searchParams.get('page') || '1')

            const movies = await this.catalogService.getLatestMovies(page)

            return NextResponse.json({
                success: true,
                data: movies,
                message: 'Ultimi film recuperati con successo'
            })
        } catch (error) {
            logger.error('Errore nel recupero ultimi film', { error })

            return NextResponse.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : 'Errore interno del server'
                },
                { status: 500 }
            )
        }
    }

    async getLatestTVShows(request: NextRequest): Promise<NextResponse> {
        try {
            const url = new URL(request.url)
            const page = parseInt(url.searchParams.get('page') || '1')

            const tvShows = await this.catalogService.getLatestTVShows(page)

            return NextResponse.json({
                success: true,
                data: tvShows,
                message: 'Ultime serie TV recuperate con successo'
            })
        } catch (error) {
            logger.error('Errore nel recupero ultime serie TV', { error })

            return NextResponse.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : 'Errore interno del server'
                },
                { status: 500 }
            )
        }
    }

    async getTopRatedMovies(request: NextRequest): Promise<NextResponse> {
        try {
            const url = new URL(request.url)
            const page = parseInt(url.searchParams.get('page') || '1')

            const movies = await this.catalogService.getTopRatedMovies(page)

            return NextResponse.json({
                success: true,
                data: movies,
                message: 'Film meglio valutati recuperati con successo'
            })
        } catch (error) {
            logger.error('Errore nel recupero film meglio valutati', { error })

            return NextResponse.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : 'Errore interno del server'
                },
                { status: 500 }
            )
        }
    }

    async getTopRatedTVShows(request: NextRequest): Promise<NextResponse> {
        try {
            const url = new URL(request.url)
            const page = parseInt(url.searchParams.get('page') || '1')

            const tvShows = await this.catalogService.getTopRatedTVShows(page)

            return NextResponse.json({
                success: true,
                data: tvShows,
                message: 'Serie TV meglio valutate recuperate con successo'
            })
        } catch (error) {
            logger.error('Errore nel recupero serie TV meglio valutate', { error })

            return NextResponse.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : 'Errore interno del server'
                },
                { status: 500 }
            )
        }
    }

    async searchMovies(request: NextRequest): Promise<NextResponse> {
        try {
            // Parse query parameters manually for now
            const url = new URL(request.url)
            const query = url.searchParams.get('query') || ''
            const page = url.searchParams.get('page') ? parseInt(url.searchParams.get('page')!) : 1
            const movies = await this.catalogService.searchMovies(query, page)

            return NextResponse.json({
                success: true,
                data: movies,
                message: 'Ricerca film completata con successo'
            })
        } catch (error) {
            logger.error('Errore nella ricerca film', { error })

            return NextResponse.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : 'Errore interno del server'
                },
                { status: 500 }
            )
        }
    }

    async searchTVShows(request: NextRequest): Promise<NextResponse> {
        try {
            // Parse query parameters manually for now
            const url = new URL(request.url)
            const query = url.searchParams.get('query') || ''
            const page = url.searchParams.get('page') ? parseInt(url.searchParams.get('page')!) : 1
            const tvShows = await this.catalogService.searchTVShows(query, page)

            return NextResponse.json({
                success: true,
                data: tvShows,
                message: 'Ricerca serie TV completata con successo'
            })
        } catch (error) {
            logger.error('Errore nella ricerca serie TV', { error })

            return NextResponse.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : 'Errore interno del server'
                },
                { status: 500 }
            )
        }
    }

    async getGenres(request: NextRequest): Promise<NextResponse> {
        try {
            const url = new URL(request.url)
            const type = url.searchParams.get('type') as 'movie' | 'tv'

            if (!type || !['movie', 'tv'].includes(type)) {
                return NextResponse.json(
                    { success: false, error: 'Tipo non valido. Usa "movie" o "tv"' },
                    { status: 400 }
                )
            }

            const genres = await this.catalogService.getGenres(type)

            return NextResponse.json({
                success: true,
                data: genres,
                message: 'Generi recuperati con successo'
            })
        } catch (error) {
            logger.error('Errore nel recupero generi', { error })

            return NextResponse.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : 'Errore interno del server'
                },
                { status: 500 }
            )
        }
    }

    async getTop10Movies(request: NextRequest): Promise<NextResponse> {
        try {
            const movies = await this.catalogService.getTop10Movies()

            return NextResponse.json({
                success: true,
                data: movies,
                message: 'Top 10 film recuperati con successo'
            })
        } catch (error) {
            logger.error('Errore nel recupero top 10 film', { error })

            return NextResponse.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : 'Errore interno del server'
                },
                { status: 500 }
            )
        }
    }

    async getPopularMovies(request: NextRequest): Promise<NextResponse> {
        try {
            const movies = await this.catalogService.getPopularMovies()

            return NextResponse.json({
                success: true,
                data: movies,
                message: 'Film popolari recuperati con successo'
            })
        } catch (error) {
            logger.error('Errore nel recupero film popolari', { error })

            return NextResponse.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : 'Errore interno del server'
                },
                { status: 500 }
            )
        }
    }

    async getRecentMovies(request: NextRequest): Promise<NextResponse> {
        try {
            const movies = await this.catalogService.getRecentMovies()

            return NextResponse.json({
                success: true,
                data: movies,
                message: 'Film recenti recuperati con successo'
            })
        } catch (error) {
            logger.error('Errore nel recupero film recenti', { error })

            return NextResponse.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : 'Errore interno del server'
                },
                { status: 500 }
            )
        }
    }
}

// Esporta le funzioni handler
export const catalogController = new CatalogController()

export const getMoviesHandler = catalogController.getMovies.bind(catalogController)
export const getTVShowsHandler = catalogController.getTVShows.bind(catalogController)
export const getPopularMoviesHandler = catalogController.getPopularMovies.bind(catalogController)
export const getPopularTVShowsHandler = catalogController.getPopularTVShows.bind(catalogController)
export const getLatestMoviesHandler = catalogController.getLatestMovies.bind(catalogController)
export const getLatestTVShowsHandler = catalogController.getLatestTVShows.bind(catalogController)
export const getTopRatedMoviesHandler = catalogController.getTopRatedMovies.bind(catalogController)
export const getTopRatedTVShowsHandler = catalogController.getTopRatedTVShows.bind(catalogController)
export const searchMoviesHandler = catalogController.searchMovies.bind(catalogController)
export const searchTVShowsHandler = catalogController.searchTVShows.bind(catalogController)
export const getGenresHandler = catalogController.getGenres.bind(catalogController)
