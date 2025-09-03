import axios from 'axios'
import { cache } from '@/utils/cache'
import { logger } from '@/utils/logger'
import { Movie, TVShow, Genre, CatalogFilters, PaginatedResponse } from '@/types'
import { VixsrcScraperService } from './vixsrc-scraper.service'
import { TMDBService } from './tmdb.service'

export class CatalogService {
    private readonly VIXSRC_BASE_URL = process.env.VIXSRC_BASE_URL || 'https://vixsrc.to'
    private readonly CACHE_TTL = 3600 // 1 hour
    private readonly vixsrcScraper: VixsrcScraperService
    private readonly tmdbService: TMDBService

    constructor() {
        this.vixsrcScraper = new VixsrcScraperService()
        this.tmdbService = new TMDBService()
    }

    // Nuovo metodo per film "now playing" (appena usciti al cinema)
    async getNowPlayingMovies(): Promise<Movie[]> {
        try {
            const cacheKey = 'now-playing-movies'
            const cached = await cache.get<Movie[]>(cacheKey)
            if (cached) {
                return cached
            }

            // Usa direttamente TMDB API per i film "now playing"
            const movies = await this.tmdbService.getNowPlayingMovies()
            
            await cache.set(cacheKey, movies, { ttl: this.CACHE_TTL })
            logger.info('Film now playing recuperati con successo', { count: movies.length })
            return movies
        } catch (error) {
            logger.error('Errore nel recupero film now playing', { error })
            return []
        }
    }

    // Nuovo metodo per i top 10 film
    async getTop10Movies(): Promise<Movie[]> {
        try {
            const cacheKey = 'top-10-movies'
            const cached = await cache.get<Movie[]>(cacheKey)
            if (cached) {
                return cached
            }

            // Usa direttamente TMDB API per i film top rated
            const movies = await this.tmdbService.getTopRatedMovies(10)
            
            await cache.set(cacheKey, movies, { ttl: this.CACHE_TTL })
            logger.info('Top 10 film recuperati con successo', { count: movies.length })
            return movies
        } catch (error) {
            logger.error('Errore nel recupero top 10 film', { error })
            return []
        }
    }

    // Nuovo metodo per film popolari (recenti e di successo)
    async getPopularMovies(): Promise<Movie[]> {
        try {
            const cacheKey = 'popular-movies'
            const cached = await cache.get<Movie[]>(cacheKey)
            if (cached) {
                return cached
            }

            // Usa direttamente TMDB API per i film popolari
            const movies = await this.tmdbService.getPopularMovies()
            
            await cache.set(cacheKey, movies, { ttl: this.CACHE_TTL })
            logger.info('Film popolari recuperati con successo', { count: movies.length })
            return movies
        } catch (error) {
            logger.error('Errore nel recupero film popolari', { error })
            return []
        }
    }

    // Nuovo metodo per film recenti (ultimi 2 anni)
    async getRecentMovies(): Promise<Movie[]> {
        try {
            const cacheKey = 'recent-movies'
            const cached = await cache.get<Movie[]>(cacheKey)
            if (cached) {
                return cached
            }

            // Usa direttamente TMDB API per i film recenti
            const movies = await this.tmdbService.getRecentMovies()
            
            await cache.set(cacheKey, movies, { ttl: this.CACHE_TTL })
            logger.info('Film recenti recuperati con successo', { count: movies.length })
            return movies
        } catch (error) {
            logger.error('Errore nel recupero film recenti', { error })
            return []
        }
    }

    async getMovies(filters: CatalogFilters = { page: 1 }): Promise<PaginatedResponse<Movie>> {
        try {
            const cacheKey = this.generateCacheKey('movies', filters)

            // Controlla la cache
            const cached = await cache.get<PaginatedResponse<Movie>>(cacheKey)
            if (cached) {
                return cached
            }

            // Prova prima con l'API di vixsrc.to
            try {
                const response = await axios.get(`${this.VIXSRC_BASE_URL}/api/list/movie?lang=it`)

                if (response.status === 200 && Array.isArray(response.data)) {
                    const tmdbIds = response.data.map((item: any) => item.tmdb_id)

                    // Ottimizzazione: parallelizzazione delle chiamate TMDB con batch processing
                    const batchSize = 5 // Processa 5 film alla volta per evitare rate limiting
                    const movies: Movie[] = []
                    
                    for (let i = 0; i < Math.min(tmdbIds.length, 20); i += batchSize) {
                        const batch = tmdbIds.slice(i, i + batchSize)
                        
                        const batchResults = await Promise.allSettled(
                            batch.map(async (tmdbId: number) => {
                                try {
                                    // Usa TMDB API per ottenere i dettagli reali
                                    const tmdbDetails = await this.tmdbService.getMovieDetails(tmdbId)
                                    if (tmdbDetails) {
                                        logger.info('Dettagli film ottenuti da TMDB', { tmdbId, title: tmdbDetails.title })
                                        return tmdbDetails
                                    }
                                } catch (error) {
                                    logger.warn('Errore nel recupero dettagli TMDB per film', { tmdbId, error })
                                }

                                // Fallback: usa dati minimi ma con ID reale per la riproduzione
                                return {
                                    id: tmdbId,
                                    title: `Film ${tmdbId}`,
                                    overview: `Film disponibile su vixsrc.to con ID ${tmdbId}. Per ottenere i dettagli completi, configura una chiave TMDB API valida.`,
                                    release_date: '',
                                    vote_average: 0,
                                    vote_count: 0,
                                    genre_ids: [],
                                    adult: false,
                                    original_language: 'en',
                                    original_title: `Film ${tmdbId}`,
                                    popularity: 0,
                                    video: false,
                                    tmdb_id: tmdbId,
                                    poster_path: '/placeholder-movie.svg',
                                    backdrop_path: '/placeholder-movie.svg'
                                }
                            })
                        )
                        
                        // Aggiungi solo i risultati riusciti
                        batchResults.forEach(result => {
                            if (result.status === 'fulfilled') {
                                movies.push(result.value)
                            }
                        })
                        
                        // Piccola pausa tra i batch per evitare rate limiting
                        if (i + batchSize < Math.min(tmdbIds.length, 20)) {
                            await new Promise(resolve => setTimeout(resolve, 100))
                        }
                    }

                    const result: PaginatedResponse<Movie> = {
                        page: filters.page || 1,
                        results: movies,
                        total_pages: Math.ceil(tmdbIds.length / 20),
                        total_results: tmdbIds.length
                    }

                    // Salva in cache
                    await cache.set(cacheKey, result, { ttl: this.CACHE_TTL })

                    logger.info('Film recuperati con successo da vixsrc.to', { count: movies.length, filters })
                    return result
                }
            } catch (apiError) {
                logger.warn('Errore API vixsrc.to, usando dati mock', { error: apiError, filters })
            }

            // Fallback a dati mock se l'API non funziona
            logger.info('Usando dati mock per i film', { filters })
            const mockData: PaginatedResponse<Movie> = {
                page: filters.page || 1,
                results: this.getMockMovies(),
                total_pages: 1,
                total_results: this.getMockMovies().length
            }

            // Salva in cache
            await cache.set(cacheKey, mockData, { ttl: this.CACHE_TTL })

            logger.info('Film mock recuperati con successo', { count: mockData.results.length, filters })
            return mockData

            /* Commentiamo temporaneamente l'integrazione con vixsrc.to
            // Costruisce i parametri per l'API
            const params = new URLSearchParams()
            params.append('lang', filters.language || 'it')
            if (filters.genre) params.append('genre', filters.genre.toString())
            if (filters.year) params.append('year', filters.year.toString())
            if (filters.sortBy) params.append('sort_by', filters.sortBy)
            if (filters.sortOrder) params.append('sort_order', filters.sortOrder)
            if (filters.page) params.append('page', filters.page.toString())

            const response = await axios.get(`${this.VIXSRC_BASE_URL}/api/list/movie?${params}`)

            if (response.status !== 200) {
                throw new Error(`Errore API: ${response.status}`)
            }

            const data = response.data

            // vixsrc.to restituisce un array diretto di tmdb_id
            if (Array.isArray(data) && data.length > 0) {
                // Converti i tmdb_id in oggetti Movie mock
                const movies = data.slice(0, 20).map((item: any, index: number) => {
                    const mockMovies = this.getMockMovies()
                    return {
                        ...mockMovies[index % mockMovies.length],
                        id: item.tmdb_id || (index + 1),
                        tmdb_id: item.tmdb_id
                    }
                })

                const result: PaginatedResponse<Movie> = {
                    page: filters.page || 1,
                    results: movies,
                    total_pages: Math.ceil(data.length / 20),
                    total_results: data.length
                }

                // Salva in cache
                await cache.set(cacheKey, result, { ttl: this.CACHE_TTL })

                logger.info('Film recuperati con successo da vixsrc.to', { count: movies.length, filters })
                return result
            }
            */
        } catch (error) {
            logger.error('Errore nel recupero film, usando dati mock', { error, filters })

            // Ritorna dati mock quando l'API esterna fallisce
            const mockData: PaginatedResponse<Movie> = {
                page: filters.page || 1,
                results: this.getMockMovies(),
                total_pages: 1,
                total_results: this.getMockMovies().length
            }

            return mockData
        }
    }

    async getTVShows(filters: CatalogFilters = { page: 1 }): Promise<PaginatedResponse<TVShow>> {
        try {
            const cacheKey = this.generateCacheKey('tv', filters)

            // Controlla la cache
            const cached = await cache.get<PaginatedResponse<TVShow>>(cacheKey)
            if (cached) {
                return cached
            }

            // Prova prima con l'API di vixsrc.to
            try {
                const response = await axios.get(`${this.VIXSRC_BASE_URL}/api/list/tv?lang=it`)

                if (response.status === 200 && Array.isArray(response.data)) {
                    const tmdbIds = response.data.map((item: any) => item.tmdb_id)

                    // Ottimizzazione: parallelizzazione delle chiamate TMDB con batch processing
                    const batchSize = 5 // Processa 5 serie TV alla volta per evitare rate limiting
                    const tvShows: TVShow[] = []
                    
                    for (let i = 0; i < Math.min(tmdbIds.length, 20); i += batchSize) {
                        const batch = tmdbIds.slice(i, i + batchSize)
                        
                        const batchResults = await Promise.allSettled(
                            batch.map(async (tmdbId: number) => {
                                try {
                                    // Usa TMDB API per ottenere i dettagli reali
                                    const tmdbDetails = await this.tmdbService.getTVShowDetails(tmdbId)
                                    if (tmdbDetails) {
                                        logger.info('Dettagli serie TV ottenuti da TMDB', { tmdbId, name: tmdbDetails.name })
                                        return tmdbDetails
                                    }
                                } catch (error) {
                                    logger.warn('Errore nel recupero dettagli TMDB per serie TV', { tmdbId, error })
                                }

                                // Fallback: usa dati minimi ma con ID reale per la riproduzione
                                return {
                                    id: tmdbId,
                                    name: `Serie TV ${tmdbId}`,
                                    overview: `Serie TV disponibile su vixsrc.to con ID ${tmdbId}. Per ottenere i dettagli completi, configura una chiave TMDB API valida.`,
                                    first_air_date: '',
                                    vote_average: 0,
                                    vote_count: 0,
                                    genre_ids: [],
                                    adult: false,
                                    origin_country: [],
                                    original_language: 'en',
                                    original_name: `Serie TV ${tmdbId}`,
                                    popularity: 0,
                                    tmdb_id: tmdbId,
                                    poster_path: '/placeholder-movie.svg',
                                    backdrop_path: '/placeholder-movie.svg'
                                }
                            })
                        )
                        
                        // Aggiungi solo i risultati riusciti
                        batchResults.forEach(result => {
                            if (result.status === 'fulfilled') {
                                tvShows.push(result.value)
                            }
                        })
                        
                        // Piccola pausa tra i batch per evitare rate limiting
                        if (i + batchSize < Math.min(tmdbIds.length, 20)) {
                            await new Promise(resolve => setTimeout(resolve, 100))
                        }
                    }

                    const result: PaginatedResponse<TVShow> = {
                        page: filters.page || 1,
                        results: tvShows,
                        total_pages: Math.ceil(tmdbIds.length / 20),
                        total_results: tmdbIds.length
                    }

                    // Salva in cache
                    await cache.set(cacheKey, result, { ttl: this.CACHE_TTL })

                    logger.info('Serie TV recuperate con successo da vixsrc.to', { count: tvShows.length, filters })
                    return result
                }
            } catch (apiError) {
                logger.warn('Errore API vixsrc.to per serie TV, usando dati mock', { error: apiError, filters })
            }

            // Fallback a dati mock se l'API non funziona
            logger.info('Usando dati mock per le serie TV', { filters })
            const mockData: PaginatedResponse<TVShow> = {
                page: filters.page || 1,
                results: this.getMockTVShows(),
                total_pages: 1,
                total_results: this.getMockTVShows().length
            }

            // Salva in cache
            await cache.set(cacheKey, mockData, { ttl: this.CACHE_TTL })

            logger.info('Serie TV mock recuperate con successo', { count: mockData.results.length, filters })
            return mockData
        } catch (error) {
            logger.error('Errore nel recupero serie TV, usando dati mock', { error, filters })

            // Ritorna dati mock quando l'API esterna fallisce
            const mockData: PaginatedResponse<TVShow> = {
                page: filters.page || 1,
                results: this.getMockTVShows(),
                total_pages: 1,
                total_results: this.getMockTVShows().length
            }

            return mockData
        }
    }



    async getPopularTVShows(page: number = 1): Promise<PaginatedResponse<TVShow>> {
        return this.getTVShows({ sortBy: 'popularity', sortOrder: 'desc', page })
    }

    async getLatestMovies(page: number = 1): Promise<PaginatedResponse<Movie>> {
        return this.getMovies({ sortBy: 'release_date', sortOrder: 'desc', page })
    }

    async getLatestTVShows(page: number = 1): Promise<PaginatedResponse<TVShow>> {
        return this.getTVShows({ sortBy: 'release_date', sortOrder: 'desc', page })
    }

    async getTopRatedMovies(page: number = 1): Promise<PaginatedResponse<Movie>> {
        return this.getMovies({ sortBy: 'vote_average', sortOrder: 'desc', page })
    }

    async getTopRatedTVShows(page: number = 1): Promise<PaginatedResponse<TVShow>> {
        return this.getTVShows({ sortBy: 'vote_average', sortOrder: 'desc', page })
    }

    async searchMovies(query: string, page: number = 1): Promise<PaginatedResponse<Movie>> {
        try {
            const cacheKey = this.generateCacheKey('search_movies', { query, page })

            // Controlla la cache
            const cached = await cache.get<PaginatedResponse<Movie>>(cacheKey)
            if (cached) {
                return cached
            }

            // Usa TMDB API per la ricerca
            const movies = await this.tmdbService.searchMovies(query, page)

            const result: PaginatedResponse<Movie> = {
                results: movies,
                page: page,
                total_pages: Math.ceil(movies.length / 20),
                total_results: movies.length
            }

            // Salva in cache
            await cache.set(cacheKey, result, { ttl: this.CACHE_TTL })

            logger.info('Ricerca film completata', { query, count: movies.length })
            return result
        } catch (error) {
            logger.error('Errore nella ricerca film', { error, query })
            throw new Error('Errore nella ricerca film')
        }
    }

    async searchTVShows(query: string, page: number = 1): Promise<PaginatedResponse<TVShow>> {
        try {
            const cacheKey = this.generateCacheKey('search_tv', { query, page })

            // Controlla la cache
            const cached = await cache.get<PaginatedResponse<TVShow>>(cacheKey)
            if (cached) {
                return cached
            }

            // Usa TMDB API per la ricerca
            const tvShows = await this.tmdbService.searchTVShows(query, page)

            const result: PaginatedResponse<TVShow> = {
                results: tvShows,
                page: page,
                total_pages: Math.ceil(tvShows.length / 20),
                total_results: tvShows.length
            }

            // Salva in cache
            await cache.set(cacheKey, result, { ttl: this.CACHE_TTL })

            logger.info('Ricerca serie TV completata', { query, count: tvShows.length })
            return result
        } catch (error) {
            logger.error('Errore nella ricerca serie TV', { error, query })
            throw new Error('Errore nella ricerca serie TV')
        }
    }

    async getGenres(type: 'movie' | 'tv'): Promise<Genre[]> {
        try {
            const cacheKey = `genres_${type}`

            // Controlla la cache
            const cached = await cache.get<Genre[]>(cacheKey)
            if (cached) {
                return cached
            }

            const response = await axios.get(`${this.VIXSRC_BASE_URL}/api/genre/${type}/list?lang=it`)

            if (response.status !== 200) {
                throw new Error(`Errore API: ${response.status}`)
            }

            const data = response.data.genres || []

            // Salva in cache per 24 ore (i generi cambiano raramente)
            await cache.set(cacheKey, data, { ttl: 86400 })

            logger.info('Generi recuperati con successo', { type, count: data.length })

            return data
        } catch (error) {
            logger.error('Errore nel recupero generi', { error, type })
            throw new Error('Errore nel recupero dei generi')
        }
    }

    private generateCacheKey(prefix: string, params: Record<string, any>): string {
        return cache.generateKey(prefix, params)
    }

    private getMockMovies(): Movie[] {
        return [
            {
                id: 1,
                title: "Inception",
                overview: "Un ladro esperto che ruba segreti dal subconscio durante lo stato di sogno.",
                poster_path: "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
                backdrop_path: "/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
                release_date: "2010-07-16",
                vote_average: 8.4,
                vote_count: 30000,
                genre_ids: [28, 878, 53],
                adult: false,
                original_language: "en",
                original_title: "Inception",
                popularity: 100.0,
                video: false
            },
            {
                id: 2,
                title: "The Dark Knight",
                overview: "Batman deve accettare uno dei test psicologici e fisici più grandi della sua capacità di combattere l'ingiustizia.",
                poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
                backdrop_path: "/hqkIcbrOHL86UncnHIsHVcVmzue.jpg",
                release_date: "2008-07-18",
                vote_average: 9.0,
                vote_count: 25000,
                genre_ids: [28, 80, 18],
                adult: false,
                original_language: "en",
                original_title: "The Dark Knight",
                popularity: 95.0,
                video: false
            },
            {
                id: 3,
                title: "Pulp Fiction",
                overview: "Le vite di due killer, un pugile, una moglie di gangster e una coppia di rapinatori si intrecciano.",
                poster_path: "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
                backdrop_path: "/4cDFJr4H1XN5Fz6zbcl5QNvxtLW.jpg",
                release_date: "1994-10-14",
                vote_average: 8.9,
                vote_count: 20000,
                genre_ids: [80, 18],
                adult: false,
                original_language: "en",
                original_title: "Pulp Fiction",
                popularity: 90.0,
                video: false
            },
            {
                id: 4,
                title: "The Godfather",
                overview: "La storia della famiglia Corleone, una delle più potenti famiglie criminali di New York.",
                poster_path: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
                backdrop_path: "/tmU7GeKVybMWFButWEGl2M4GeiP.jpg",
                release_date: "1972-03-24",
                vote_average: 9.2,
                vote_count: 18000,
                genre_ids: [80, 18],
                adult: false,
                original_language: "en",
                original_title: "The Godfather",
                popularity: 85.0,
                video: false
            },
            {
                id: 5,
                title: "Forrest Gump",
                overview: "La storia di Forrest Gump, un uomo con un QI basso ma con un cuore d'oro.",
                poster_path: "/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
                backdrop_path: "/7c9UVPPiTPltouxRVY6N9uugaVA.jpg",
                release_date: "1994-07-06",
                vote_average: 8.8,
                vote_count: 22000,
                genre_ids: [35, 18, 10749],
                adult: false,
                original_language: "en",
                original_title: "Forrest Gump",
                popularity: 80.0,
                video: false
            },
            {
                id: 6,
                title: "The Matrix",
                overview: "Un programmatore scopre che la realtà è una simulazione creata da macchine intelligenti.",
                poster_path: "/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
                backdrop_path: "/7u3pxc0K1wx32IleAkLv78MKgrw.jpg",
                release_date: "1999-03-30",
                vote_average: 8.7,
                vote_count: 24000,
                genre_ids: [28, 878],
                adult: false,
                original_language: "en",
                original_title: "The Matrix",
                popularity: 88.0,
                video: false
            },
            {
                id: 7,
                title: "Interstellar",
                overview: "Un gruppo di astronauti viaggia attraverso un buco nero per trovare un nuovo pianeta per l'umanità.",
                poster_path: "/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg",
                backdrop_path: "/5a4JdufDf2tripNyv7mrq8a1w0p.jpg",
                release_date: "2014-11-05",
                vote_average: 8.6,
                vote_count: 26000,
                genre_ids: [18, 878],
                adult: false,
                original_language: "en",
                original_title: "Interstellar",
                popularity: 92.0,
                video: false
            },
            {
                id: 8,
                title: "The Shawshank Redemption",
                overview: "La storia di un banchiere condannato per omicidio che stringe amicizia con un altro detenuto.",
                poster_path: "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
                backdrop_path: "/iNh3BivHyg5sQRPP1KOkzguEX0H.jpg",
                release_date: "1994-09-23",
                vote_average: 9.3,
                vote_count: 28000,
                genre_ids: [18, 80],
                adult: false,
                original_language: "en",
                original_title: "The Shawshank Redemption",
                popularity: 87.0,
                video: false
            },
            {
                id: 9,
                title: "Fight Club",
                overview: "Un impiegato insoddisfatto forma un club segreto di combattimento con un venditore di sapone.",
                poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
                backdrop_path: "/87hTDiay2N2qWyX4Dx7dLITwXlo.jpg",
                release_date: "1999-10-15",
                vote_average: 8.8,
                vote_count: 21000,
                genre_ids: [18],
                adult: false,
                original_language: "en",
                original_title: "Fight Club",
                popularity: 83.0,
                video: false
            },
            {
                id: 10,
                title: "Goodfellas",
                overview: "La storia di Henry Hill e della sua vita nella mafia americana.",
                poster_path: "/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg",
                backdrop_path: "/sw7mordbZxgITU877yTpZCud90M.jpg",
                release_date: "1990-09-12",
                vote_average: 8.7,
                vote_count: 19000,
                genre_ids: [80, 18],
                adult: false,
                original_language: "en",
                original_title: "Goodfellas",
                popularity: 81.0,
                video: false
            }
        ]
    }

    private getMockTVShows(): TVShow[] {
        return [
            {
                id: 1,
                name: "Breaking Bad",
                overview: "Un insegnante di chimica malato di cancro si trasforma in un produttore di metanfetamine.",
                poster_path: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
                backdrop_path: "/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg",
                first_air_date: "2008-01-20",
                vote_average: 9.5,
                vote_count: 15000,
                genre_ids: [80, 18],
                adult: false,
                original_language: "en",
                original_name: "Breaking Bad",
                popularity: 95.0,
                origin_country: ["US"]
            },
            {
                id: 2,
                name: "Game of Thrones",
                overview: "Nove famiglie nobili lottano per il controllo delle terre di Westeros.",
                poster_path: "/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg",
                backdrop_path: "/2OMB0ynKlyIenMJWI2Dy9IWT4c.jpg",
                first_air_date: "2011-04-17",
                vote_average: 8.3,
                vote_count: 20000,
                genre_ids: [18, 14, 12],
                adult: false,
                original_language: "en",
                original_name: "Game of Thrones",
                popularity: 90.0,
                origin_country: ["US"]
            },
            {
                id: 3,
                name: "The Office",
                overview: "La vita quotidiana dei dipendenti di un'azienda di carta a Scranton, Pennsylvania.",
                poster_path: "/7DJKHzAi73O7btVhJqO7vL8jfzP.jpg",
                backdrop_path: "/7DJKHzAi73O7btVhJqO7vL8jfzP.jpg",
                first_air_date: "2005-03-24",
                vote_average: 8.5,
                vote_count: 12000,
                genre_ids: [35],
                adult: false,
                original_language: "en",
                original_name: "The Office",
                popularity: 85.0,
                origin_country: ["US"]
            },
            {
                id: 4,
                name: "Stranger Things",
                overview: "Un gruppo di bambini scopre segreti soprannaturali nella loro piccola città.",
                poster_path: "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
                backdrop_path: "/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",
                first_air_date: "2016-07-15",
                vote_average: 8.7,
                vote_count: 18000,
                genre_ids: [18, 14, 27],
                adult: false,
                original_language: "en",
                original_name: "Stranger Things",
                popularity: 88.0,
                origin_country: ["US"]
            },
            {
                id: 5,
                name: "The Walking Dead",
                overview: "Un gruppo di sopravvissuti cerca di sopravvivere in un mondo infestato da zombie.",
                poster_path: "/rqeYMLryjcawh2JeRpCVUDXYM5b.jpg",
                backdrop_path: "/wXXaPMgrv96NkH8KD1TMdS2d7iq.jpg",
                first_air_date: "2010-10-31",
                vote_average: 8.1,
                vote_count: 16000,
                genre_ids: [18, 27, 14],
                adult: false,
                original_language: "en",
                original_name: "The Walking Dead",
                popularity: 82.0,
                origin_country: ["US"]
            },
            {
                id: 6,
                name: "House of Cards",
                overview: "Un politico spietato e ambizioso sale al potere a Washington.",
                poster_path: "/hKWxWjFwnazd87h4FQf6tD5xVPR.jpg",
                backdrop_path: "/7Nwnmyzrtd0FkcRyPqmdzTPppQa.jpg",
                first_air_date: "2013-02-01",
                vote_average: 8.7,
                vote_count: 14000,
                genre_ids: [18, 80],
                adult: false,
                original_language: "en",
                original_name: "House of Cards",
                popularity: 86.0,
                origin_country: ["US"]
            },
            {
                id: 7,
                name: "Narcos",
                overview: "La storia del famoso cartello di droga di Pablo Escobar.",
                poster_path: "/7vjaCdMw15FEbXyLQTVa04URsPm.jpg",
                backdrop_path: "/tTfnd2VrlaZJSBD9HUbtSF3CqPJ.jpg",
                first_air_date: "2015-08-28",
                vote_average: 8.8,
                vote_count: 13000,
                genre_ids: [80, 18],
                adult: false,
                original_language: "en",
                original_name: "Narcos",
                popularity: 84.0,
                origin_country: ["US"]
            },
            {
                id: 8,
                name: "The Crown",
                overview: "La storia della regina Elisabetta II e della famiglia reale britannica.",
                poster_path: "/1M876Kj8VgHM2nKvqGq8VJ8vJ8v.jpg",
                backdrop_path: "/1M876Kj8VgHM2nKvqGq8VJ8vJ8v.jpg",
                first_air_date: "2016-11-04",
                vote_average: 8.6,
                vote_count: 11000,
                genre_ids: [18, 36],
                adult: false,
                original_language: "en",
                original_name: "The Crown",
                popularity: 79.0,
                origin_country: ["US"]
            }
        ]
    }
}
