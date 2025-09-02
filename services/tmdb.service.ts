import axios from 'axios'
import { logger } from '@/utils/logger'
import { Movie, TVShow } from '@/types'

export class TMDBService {
    private readonly TMDB_BASE_URL = 'https://api.themoviedb.org/3'
    private readonly TMDB_API_KEY = process.env.TMDB_API_KEY || 'demo'
    private readonly TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p'

    // Metodo per ottenere film "now playing" (appena usciti al cinema)
    async getNowPlayingMovies(): Promise<Movie[]> {
        try {
            const response = await axios.get(`${this.TMDB_BASE_URL}/movie/now_playing`, {
                params: {
                    api_key: this.TMDB_API_KEY,
                    language: 'it-IT',
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

    async getMovieDetails(tmdbId: number): Promise<Movie | null> {
        try {
            const response = await axios.get(`${this.TMDB_BASE_URL}/movie/${tmdbId}`, {
                params: {
                    api_key: this.TMDB_API_KEY,
                    language: 'it-IT'
                }
            })

            if (response.status === 200) {
                const data = response.data

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
                    tmdb_id: tmdbId
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
                    language: 'it-IT'
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
