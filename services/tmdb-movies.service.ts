import axios from 'axios'
import { logger } from '@/lib/utils'

export interface TMDBMovie {
    id: number
    title: string
    original_title: string
    overview: string
    poster_path: string | null
    backdrop_path: string | null
    release_date: string
    vote_average: number
    vote_count: number
    popularity: number
    adult: boolean
    video: boolean
    genre_ids: number[]
    original_language: string
    runtime?: number
    genres?: Array<{ id: number; name: string }>
}

export interface TMDBTrailer {
    id: string
    key: string
    name: string
    site: string
    type: string
    official: boolean
    published_at: string
}

export interface TMDBResponse<T> {
    page: number
    results: T[]
    total_pages: number
    total_results: number
}

export interface TMDBTrailerResponse {
    id: number
    results: TMDBTrailer[]
}

export class TMDBMoviesService {
    private readonly TMDB_BASE_URL = 'https://api.themoviedb.org/3'
    private readonly TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p'
    private readonly apiKey: string
    private readonly timeout = 10000

    constructor() {
        // Prova diverse fonti per la API key
        this.apiKey = process.env.TMDB_API_KEY ||
            process.env.NEXT_PUBLIC_TMDB_API_KEY ||
            '0bb900c0ff6e6fdce7c1c898fbae1b8f' // Fallback alla chiave dal .env
    }

    private checkApiKey(): void {
        if (!this.apiKey) {
            console.error('❌ TMDB_API_KEY non configurata!')
            console.error('📝 Segui le istruzioni in SETUP.md per configurare la API key')
            console.error('🔧 Chiave attuale:', this.apiKey || 'undefined')
            throw new Error('TMDB_API_KEY non configurata. Vedi SETUP.md per le istruzioni.')
        }
        console.log('✅ TMDB_API_KEY configurata correttamente')
    }

    private async makeRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
        this.checkApiKey()

        try {
            const response = await axios.get(`${this.TMDB_BASE_URL}${endpoint}`, {
                params: {
                    api_key: this.apiKey,
                    language: 'it-IT',
                    region: 'IT',
                    ...params
                },
                timeout: this.timeout
            })

            return response.data
        } catch (error) {
            logger.error('Errore richiesta TMDB', { endpoint, error })
            throw error
        }
    }

    /**
     * Ottiene i film più popolari
     */
    async getPopularMovies(page: number = 1): Promise<TMDBResponse<TMDBMovie>> {
        return this.makeRequest<TMDBResponse<TMDBMovie>>('/movie/popular', { page })
    }

    /**
     * Ottiene i film meglio votati
     */
    async getTopRatedMovies(page: number = 1): Promise<TMDBResponse<TMDBMovie>> {
        return this.makeRequest<TMDBResponse<TMDBMovie>>('/movie/top_rated', { page })
    }

    /**
     * Ottiene i film in uscita
     */
    async getNowPlayingMovies(page: number = 1): Promise<TMDBResponse<TMDBMovie>> {
        return this.makeRequest<TMDBResponse<TMDBMovie>>('/movie/now_playing', { page })
    }

    /**
     * Ottiene i film in arrivo
     */
    async getUpcomingMovies(page: number = 1): Promise<TMDBResponse<TMDBMovie>> {
        return this.makeRequest<TMDBResponse<TMDBMovie>>('/movie/upcoming', { page })
    }

    /**
     * Ottiene i dettagli di un film specifico
     */
    async getMovieDetails(movieId: number): Promise<TMDBMovie> {
        return this.makeRequest<TMDBMovie>(`/movie/${movieId}`)
    }

    /**
     * Ottiene i trailer di un film
     */
    async getMovieTrailers(movieId: number): Promise<TMDBTrailerResponse> {
        return this.makeRequest<TMDBTrailerResponse>(`/movie/${movieId}/videos`)
    }

    /**
     * Cerca film per query
     */
    async searchMovies(query: string, page: number = 1): Promise<TMDBResponse<TMDBMovie>> {
        return this.makeRequest<TMDBResponse<TMDBMovie>>('/search/movie', {
            query,
            page,
            include_adult: false
        })
    }

    /**
     * Ottiene i generi dei film
     */
    async getMovieGenres(): Promise<{ id: number; name: string }[]> {
        const response = await this.makeRequest<{ genres: { id: number; name: string }[] }>('/genre/movie/list')
        return response.genres
    }

    /**
     * Ottiene i dettagli di una serie TV
     */
    async getTVShowDetails(tvShowId: number): Promise<any> {
        const response = await this.makeRequest(`/tv/${tvShowId}`)

        if (response) {
            // Aggiungi i campi mancanti per compatibilità
            return {
                ...response,
                tmdb_id: tvShowId,
                number_of_seasons: (response as any).number_of_seasons || 1,
                number_of_episodes: (response as any).number_of_episodes || 1,
                genres: (response as any).genres || []
            }
        }

        return response
    }

    /**
     * Cerca serie TV per query
     */
    async searchTVShows(query: string, page: number = 1): Promise<any[]> {
        const response = await this.makeRequest<any>('/search/tv', {
            query,
            page,
            include_adult: false
        })
        return response.results
    }

    /**
     * Ottiene le serie TV top rated
     */
    async getTopRatedTVShows(limit: number = 10): Promise<{ results: any[] }> {
        const response = await this.makeRequest<any>('/tv/top_rated', {
            page: 1
        })
        return {
            results: response.results.slice(0, limit)
        }
    }

    /**
     * Genera URL immagine TMDB
     */
    getImageUrl(path: string | null | undefined, size: 'w200' | 'w300' | 'w500' | 'w780' | 'w1280' | 'original' = 'w500'): string {
        if (!path) return '/placeholder-movie.svg'
        return `${this.TMDB_IMAGE_BASE_URL}/${size}${path}`
    }

    /**
     * Ottiene il trailer principale di un film
     */
    async getMainTrailer(movieId: number): Promise<TMDBTrailer | null> {
        try {
            const trailers = await this.getMovieTrailers(movieId)

            // Cerca trailer ufficiale su YouTube
            const officialTrailer = trailers.results.find(trailer =>
                trailer.site === 'YouTube' &&
                trailer.type === 'Trailer' &&
                trailer.official
            )

            if (officialTrailer) return officialTrailer

            // Fallback al primo trailer disponibile
            const anyTrailer = trailers.results.find(trailer =>
                trailer.site === 'YouTube' &&
                trailer.type === 'Trailer'
            )

            return anyTrailer || null
        } catch (error) {
            logger.error('Errore nel recupero trailer', { movieId, error })
            return null
        }
    }

    /**
     * Ottiene tutti i video di un film (trailer, teaser, clip, etc.)
     */
    async getMovieVideos(movieId: number): Promise<TMDBTrailerResponse | null> {
        try {
            const response = await this.makeRequest(`/movie/${movieId}/videos`)
            return response as TMDBTrailerResponse
        } catch (error) {
            logger.error('Errore nel recupero video film', { movieId, error })
            return null
        }
    }

    /**
     * Ottiene tutti i video di una serie TV (trailer, teaser, clip, etc.)
     */
    async getTVShowVideos(tvShowId: number): Promise<TMDBTrailerResponse | null> {
        try {
            const response = await this.makeRequest(`/tv/${tvShowId}/videos`)
            return response as TMDBTrailerResponse
        } catch (error) {
            logger.error('Errore nel recupero video serie TV', { tvShowId, error })
            return null
        }
    }

    /**
     * Genera URL VixSrc personalizzato per un film
     */
    getVixSrcUrl(movieId: number): string {
        const baseUrl = process.env.VIXSRC_BASE_URL || 'https://vixsrc.to'
        const primaryColor = process.env.VIXSRC_PRIMARY_COLOR || 'B20710'
        const secondaryColor = process.env.VIXSRC_SECONDARY_COLOR || '170000'
        const autoplay = process.env.VIXSRC_AUTOPLAY || 'false'
        const lang = process.env.VIXSRC_LANG || 'it'

        return `${baseUrl}/movie/${movieId}?primaryColor=${primaryColor}&secondaryColor=${secondaryColor}&autoplay=${autoplay}&lang=${lang}`
    }

    /**
     * Ottiene i top 10 film popolari
     */
    async getTop10Movies(): Promise<TMDBMovie[]> {
        try {
            const response = await this.getPopularMovies(1)
            return response.results.slice(0, 10)
        } catch (error) {
            logger.error('Errore nel recupero top 10 film', { error })
            return []
        }
    }

    /**
     * Ottiene i film in uscita questa settimana
     */
    async getThisWeekMovies(): Promise<TMDBMovie[]> {
        try {
            const response = await this.getNowPlayingMovies(1)
            return response.results.slice(0, 20)
        } catch (error) {
            logger.error('Errore nel recupero film in uscita', { error })
            return []
        }
    }
}

// Istanza singleton
export const tmdbMoviesService = new TMDBMoviesService()
