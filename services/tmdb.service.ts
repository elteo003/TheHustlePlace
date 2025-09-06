import axios from 'axios'
import { logger } from '@/utils/logger'
import { Movie, TVShow } from '@/types'

export class TMDBService {
    private readonly TMDB_BASE_URL = 'https://api.themoviedb.org/3'
    private readonly TMDB_API_KEY = process.env.TMDB_API_KEY || 'demo'
    private readonly TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p'
    private readonly MAX_RETRIES = 3
    private readonly RETRY_DELAY = 1000 // 1 second
    private readonly RATE_LIMIT_DELAY = 200 // 200ms between requests
    private lastRequestTime = 0

    // Rate limiting helper
    private async rateLimit(): Promise<void> {
        const now = Date.now()
        const timeSinceLastRequest = now - this.lastRequestTime

        if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
            await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY - timeSinceLastRequest))
        }

        this.lastRequestTime = Date.now()
    }

    // Retry logic helper
    private async makeRequestWithRetry<T>(requestFn: () => Promise<T>): Promise<T> {
        let lastError: Error | null = null

        for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
            try {
                await this.rateLimit()
                return await requestFn()
            } catch (error) {
                lastError = error as Error
                logger.warn(`TMDB API request failed (attempt ${attempt}/${this.MAX_RETRIES})`, { error })

                if (attempt < this.MAX_RETRIES) {
                    await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * attempt))
                }
            }
        }

        throw lastError || new Error('TMDB API request failed after all retries')
    }

    // Metodo per ottenere film "now playing" (appena usciti al cinema)
    async getNowPlayingMovies(): Promise<Movie[]> {
        try {
            const response = await this.makeRequestWithRetry(() =>
                axios.get(`${this.TMDB_BASE_URL}/movie/now_playing`, {
                    params: {
                        api_key: this.TMDB_API_KEY,
                        language: 'it-IT',
                        region: 'IT',
                        page: 1
                    }
                })
            )

            if (response.status === 200 && response.data.results) {
                return response.data.results.map((movie: any) => ({
                    id: movie.id,
                    title: movie.title || `Film ${movie.id}`,
                    overview: movie.overview || 'Descrizione non disponibile',
                    release_date: movie.release_date || '',
                    vote_average: movie.vote_average || 0,
                    vote_count: movie.vote_count || 0,
                    genre_ids: movie.genre_ids || [],
                    adult: movie.adult || false,
                    backdrop_path: movie.backdrop_path || '/placeholder-movie.svg',
                    original_language: movie.original_language || 'en',
                    original_title: movie.original_title || movie.title,
                    popularity: movie.popularity || 0,
                    poster_path: movie.poster_path || '/placeholder-movie.svg',
                    video: movie.video || false,
                    tmdb_id: movie.id
                }))
            }
            return []
        } catch (error) {
            logger.error('Errore nel recupero film now playing da TMDB', { error })
            return []
        }
    }

    // Metodo per ottenere i film top rated
    async getTopRatedMovies(limit: number = 10): Promise<Movie[]> {
        try {
            const response = await axios.get(`${this.TMDB_BASE_URL}/movie/top_rated`, {
                params: {
                    api_key: this.TMDB_API_KEY,
                    language: 'it-IT',
                    region: 'IT',
                    page: 1
                }
            })

            if (response.status === 200 && response.data.results) {
                return response.data.results.slice(0, limit).map((movie: any) => ({
                    id: movie.id,
                    title: movie.title || `Film ${movie.id}`,
                    overview: movie.overview || 'Descrizione non disponibile',
                    release_date: movie.release_date || '',
                    vote_average: movie.vote_average || 0,
                    vote_count: movie.vote_count || 0,
                    genre_ids: movie.genre_ids || [],
                    adult: movie.adult || false,
                    backdrop_path: movie.backdrop_path || '/placeholder-movie.svg',
                    original_language: movie.original_language || 'en',
                    original_title: movie.original_title || movie.title,
                    popularity: movie.popularity || 0,
                    poster_path: movie.poster_path || '/placeholder-movie.svg',
                    video: movie.video || false,
                    tmdb_id: movie.id
                }))
            }
            return []
        } catch (error) {
            logger.error('Errore nel recupero film top rated da TMDB', { error })
            return []
        }
    }

    async getMovieDetails(tmdbId: number): Promise<any> {
        try {
            // Recupera dettagli del film e video in parallelo
            const [movieResponse, videosResponse] = await Promise.all([
                axios.get(`${this.TMDB_BASE_URL}/movie/${tmdbId}`, {
                    params: {
                        api_key: this.TMDB_API_KEY,
                        language: 'it-IT',
                        region: 'IT'
                    }
                }),
                axios.get(`${this.TMDB_BASE_URL}/movie/${tmdbId}/videos`, {
                    params: {
                        api_key: this.TMDB_API_KEY,
                        language: 'it-IT',
                        region: 'IT'
                    }
                })
            ])

            if (movieResponse.status === 200) {
                const data = movieResponse.data
                const videos = videosResponse.status === 200 ? videosResponse.data : { results: [] }

                return {
                    id: tmdbId,
                    title: data.title || `Film ${tmdbId}`,
                    overview: data.overview || 'Descrizione non disponibile',
                    release_date: data.release_date || '',
                    vote_average: data.vote_average || 0,
                    vote_count: data.vote_count || 0,
                    genre_ids: data.genres?.map((g: any) => g.id) || [],
                    adult: data.adult || false,
                    backdrop_path: data.backdrop_path || '/placeholder-movie.svg',
                    original_language: data.original_language || 'en',
                    original_title: data.original_title || data.title,
                    popularity: data.popularity || 0,
                    poster_path: data.poster_path || '/placeholder-movie.svg',
                    video: data.video || false,
                    tmdb_id: tmdbId,
                    videos: videos
                }
            }

            return null
        } catch (error) {
            logger.warn('Errore nel recupero dettagli TMDB per film', { tmdbId, error })
            return null
        }
    }

    async getTVShowDetails(tmdbId: number): Promise<TVShow | null> {
        try {
            const response = await axios.get(`${this.TMDB_BASE_URL}/tv/${tmdbId}`, {
                params: {
                    api_key: this.TMDB_API_KEY,
                    language: 'it-IT',
                    region: 'IT'
                }
            })

            if (response.status === 200) {
                const data = response.data

                return {
                    id: tmdbId,
                    name: data.name || `Serie TV ${tmdbId}`,
                    overview: data.overview || 'Descrizione non disponibile',
                    first_air_date: data.first_air_date || '',
                    vote_average: data.vote_average || 0,
                    vote_count: data.vote_count || 0,
                    genre_ids: data.genres?.map((g: any) => g.id) || [],
                    adult: data.adult || false,
                    backdrop_path: data.backdrop_path || '/placeholder-movie.svg',
                    origin_country: data.origin_country || [],
                    original_language: data.original_language || 'en',
                    original_name: data.original_name || data.name,
                    popularity: data.popularity || 0,
                    poster_path: data.poster_path || '/placeholder-movie.svg',
                    tmdb_id: tmdbId
                }
            }

            return null
        } catch (error) {
            logger.warn('Errore nel recupero dettagli TMDB per serie TV', { tmdbId, error })
            return null
        }
    }

    getImageUrl(path: string | null | undefined, size: 'w200' | 'w300' | 'w500' | 'w780' | 'w1280' | 'original' = 'w500'): string {
        if (!path) return '/placeholder-movie.svg'
        return `${this.TMDB_IMAGE_BASE_URL}/${size}${path}`
    }

    // Metodo per ottenere film popolari (recenti e di successo)
    async getPopularMovies(): Promise<Movie[]> {
        try {
            const response = await axios.get(`${this.TMDB_BASE_URL}/movie/popular`, {
                params: {
                    api_key: this.TMDB_API_KEY,
                    language: 'it-IT',
                    region: 'IT',
                    page: 1
                }
            })

            if (response.status === 200 && response.data.results) {
                return response.data.results.map((movie: any) => ({
                    id: movie.id,
                    title: movie.title || `Film ${movie.id}`,
                    overview: movie.overview || 'Descrizione non disponibile',
                    release_date: movie.release_date || '',
                    vote_average: movie.vote_average || 0,
                    vote_count: movie.vote_count || 0,
                    genre_ids: movie.genre_ids || [],
                    adult: movie.adult || false,
                    backdrop_path: movie.backdrop_path || '/placeholder-movie.svg',
                    original_language: movie.original_language || 'en',
                    original_title: movie.original_title || movie.title,
                    popularity: movie.popularity || 0,
                    poster_path: movie.poster_path || '/placeholder-movie.svg',
                    video: movie.video || false,
                    tmdb_id: movie.id
                }))
            }
            return []
        } catch (error) {
            logger.error('Errore nel recupero film popolari da TMDB', { error })
            return []
        }
    }

    // Metodo per ottenere film recenti (ultimi 2 anni)
    async getRecentMovies(): Promise<Movie[]> {
        try {
            const currentYear = new Date().getFullYear()
            const twoYearsAgo = currentYear - 2

            const response = await axios.get(`${this.TMDB_BASE_URL}/discover/movie`, {
                params: {
                    api_key: this.TMDB_API_KEY,
                    language: 'it-IT',
                    region: 'IT',
                    page: 1,
                    sort_by: 'release_date.desc',
                    'primary_release_date.gte': `${twoYearsAgo}-01-01`,
                    'primary_release_date.lte': `${currentYear}-12-31`,
                    vote_count: { gte: 100 } // Solo film con almeno 100 voti
                }
            })

            if (response.status === 200 && response.data.results) {
                return response.data.results.map((movie: any) => ({
                    id: movie.id,
                    title: movie.title || `Film ${movie.id}`,
                    overview: movie.overview || 'Descrizione non disponibile',
                    release_date: movie.release_date || '',
                    vote_average: movie.vote_average || 0,
                    vote_count: movie.vote_count || 0,
                    genre_ids: movie.genre_ids || [],
                    adult: movie.adult || false,
                    backdrop_path: movie.backdrop_path || '/placeholder-movie.svg',
                    original_language: movie.original_language || 'en',
                    original_title: movie.original_title || movie.title,
                    popularity: movie.popularity || 0,
                    poster_path: movie.poster_path || '/placeholder-movie.svg',
                    video: movie.video || false,
                    tmdb_id: movie.id
                }))
            }
            return []
        } catch (error) {
            logger.error('Errore nel recupero film recenti da TMDB', { error })
            return []
        }
    }

    // Metodo per cercare film
    async searchMovies(query: string, page: number = 1): Promise<Movie[]> {
        try {
            const response = await axios.get(`${this.TMDB_BASE_URL}/search/movie`, {
                params: {
                    api_key: this.TMDB_API_KEY,
                    language: 'it-IT',
                    region: 'IT',
                    query: query,
                    page: page
                }
            })

            if (response.status === 200 && response.data.results) {
                return response.data.results.map((movie: any) => ({
                    id: movie.id,
                    title: movie.title || `Film ${movie.id}`,
                    overview: movie.overview || 'Descrizione non disponibile',
                    release_date: movie.release_date || '',
                    vote_average: movie.vote_average || 0,
                    vote_count: movie.vote_count || 0,
                    genre_ids: movie.genre_ids || [],
                    adult: movie.adult || false,
                    backdrop_path: movie.backdrop_path || '/placeholder-movie.svg',
                    original_language: movie.original_language || 'en',
                    original_title: movie.original_title || movie.title,
                    popularity: movie.popularity || 0,
                    poster_path: movie.poster_path || '/placeholder-movie.svg',
                    video: movie.video || false,
                    tmdb_id: movie.id
                }))
            }
            return []
        } catch (error) {
            logger.error('Errore nella ricerca film TMDB', { error, query })
            return []
        }
    }

    // Metodo per ottenere le serie TV top rated
    async getTopRatedTVShows(limit: number = 10): Promise<{ results: TVShow[] }> {
        try {
            const response = await axios.get(`${this.TMDB_BASE_URL}/tv/top_rated`, {
                params: {
                    api_key: this.TMDB_API_KEY,
                    language: 'it-IT',
                    region: 'IT',
                    page: 1
                }
            })

            if (response.status === 200 && response.data.results) {
                const tvShows = response.data.results.slice(0, limit).map((tv: any) => ({
                    id: tv.id,
                    name: tv.name || `Serie TV ${tv.id}`,
                    overview: tv.overview || 'Descrizione non disponibile',
                    first_air_date: tv.first_air_date || '',
                    vote_average: tv.vote_average || 0,
                    vote_count: tv.vote_count || 0,
                    genre_ids: tv.genre_ids || [],
                    adult: tv.adult || false,
                    backdrop_path: tv.backdrop_path || '/placeholder-movie.svg',
                    origin_country: tv.origin_country || [],
                    original_language: tv.original_language || 'en',
                    original_name: tv.original_name || tv.name,
                    popularity: tv.popularity || 0,
                    poster_path: tv.poster_path || '/placeholder-movie.svg',
                    tmdb_id: tv.id
                }))
                return { results: tvShows }
            }
            return { results: [] }
        } catch (error) {
            logger.error('Errore nel recupero serie TV top rated da TMDB', { error })
            return { results: [] }
        }
    }

    // Metodo per cercare serie TV
    async searchTVShows(query: string, page: number = 1): Promise<TVShow[]> {
        try {
            const response = await axios.get(`${this.TMDB_BASE_URL}/search/tv`, {
                params: {
                    api_key: this.TMDB_API_KEY,
                    language: 'it-IT',
                    region: 'IT',
                    query: query,
                    page: page
                }
            })

            if (response.status === 200 && response.data.results) {
                return response.data.results.map((tv: any) => ({
                    id: tv.id,
                    name: tv.name || `Serie TV ${tv.id}`,
                    overview: tv.overview || 'Descrizione non disponibile',
                    first_air_date: tv.first_air_date || '',
                    vote_average: tv.vote_average || 0,
                    vote_count: tv.vote_count || 0,
                    genre_ids: tv.genre_ids || [],
                    adult: tv.adult || false,
                    backdrop_path: tv.backdrop_path || '/placeholder-movie.svg',
                    origin_country: tv.origin_country || [],
                    original_language: tv.original_language || 'en',
                    original_name: tv.original_name || tv.name,
                    popularity: tv.popularity || 0,
                    poster_path: tv.poster_path || '/placeholder-movie.svg',
                    tmdb_id: tv.id
                }))
            }
            return []
        } catch (error) {
            logger.error('Errore nella ricerca serie TV TMDB', { error, query })
            return []
        }
    }

    // Metodo per testare se la chiave API funziona
    async testAPIKey(): Promise<boolean> {
        try {
            const response = await axios.get(`${this.TMDB_BASE_URL}/movie/550`, {
                params: {
                    api_key: this.TMDB_API_KEY
                }
            })
            return response.status === 200
        } catch (error) {
            logger.error('Chiave API TMDB non valida', { error })
            return false
        }
    }
}
