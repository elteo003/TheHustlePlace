import axios from 'axios'
import { logger } from '@/utils/logger'

export interface VixsrcMovieDetails {
    id: number
    title: string
    overview: string
    poster_path?: string
    backdrop_path?: string
    release_date?: string
    vote_average?: number
    genre_ids?: number[]
    original_language?: string
    original_title?: string
    popularity?: number
    video?: boolean
    tmdb_id: number
}

export interface VixsrcTVShowDetails {
    id: number
    name: string
    overview: string
    poster_path?: string
    backdrop_path?: string
    first_air_date?: string
    vote_average?: number
    genre_ids?: number[]
    origin_country?: string[]
    original_language?: string
    original_name?: string
    popularity?: number
    tmdb_id: number
}

export class VixsrcScraperService {
    private readonly VIXSRC_BASE_URL = process.env.VIXSRC_BASE_URL || 'https://vixsrc.to'

    async getMovieDetails(tmdbId: number): Promise<VixsrcMovieDetails | null> {
        try {
            const response = await axios.get(`${this.VIXSRC_BASE_URL}/movie/${tmdbId}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            })

            if (response.status === 200) {
                const html = response.data

                // Estrai il titolo dal tag <title>
                const titleMatch = html.match(/<title>([^<]+)<\/title>/i)
                const title = titleMatch ? titleMatch[1].trim() : `Film ${tmdbId}`

                // Cerca metadati nel JSON-LD o altri tag meta
                const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/is)
                let overview = `Film disponibile su vixsrc.to con ID ${tmdbId}`
                let poster_path = '/placeholder-movie.svg'
                let backdrop_path = '/placeholder-movie.svg'
                let release_date = ''
                let vote_average = 0

                if (jsonLdMatch) {
                    try {
                        const jsonData = JSON.parse(jsonLdMatch[1])
                        if (jsonData.description) overview = jsonData.description
                        if (jsonData.image) poster_path = jsonData.image
                        if (jsonData.datePublished) release_date = jsonData.datePublished
                    } catch (e) {
                        logger.warn('Errore nel parsing JSON-LD', { tmdbId, error: e })
                    }
                }

                // Cerca immagini nella pagina
                const posterMatch = html.match(/<img[^>]*src="([^"]*)"[^>]*class="[^"]*poster[^"]*"/i) ||
                    html.match(/<img[^>]*class="[^"]*poster[^"]*"[^>]*src="([^"]*)"/i)
                if (posterMatch && posterMatch[1]) {
                    poster_path = posterMatch[1].startsWith('http') ? posterMatch[1] : `${this.VIXSRC_BASE_URL}${posterMatch[1]}`
                }

                const backdropMatch = html.match(/<img[^>]*src="([^"]*)"[^>]*class="[^"]*backdrop[^"]*"/i) ||
                    html.match(/<img[^>]*class="[^"]*backdrop[^"]*"[^>]*src="([^"]*)"/i)
                if (backdropMatch && backdropMatch[1]) {
                    backdrop_path = backdropMatch[1].startsWith('http') ? backdropMatch[1] : `${this.VIXSRC_BASE_URL}${backdropMatch[1]}`
                }

                return {
                    id: tmdbId,
                    title,
                    overview,
                    poster_path,
                    backdrop_path,
                    release_date,
                    vote_average,
                    genre_ids: [],
                    original_language: 'en',
                    original_title: title,
                    popularity: 0,
                    video: false,
                    tmdb_id: tmdbId
                }
            }

            return null
        } catch (error) {
            logger.error('Errore nel scraping dettagli film da vixsrc.to', { tmdbId, error })
            return null
        }
    }

    async getTVShowDetails(tmdbId: number): Promise<VixsrcTVShowDetails | null> {
        try {
            const response = await axios.get(`${this.VIXSRC_BASE_URL}/tv/${tmdbId}/1/1`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            })

            if (response.status === 200) {
                const html = response.data

                // Estrai il titolo dal tag <title>
                const titleMatch = html.match(/<title>([^<]+)<\/title>/i)
                const name = titleMatch ? titleMatch[1].trim() : `Serie TV ${tmdbId}`

                // Cerca metadati nel JSON-LD o altri tag meta
                const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/is)
                let overview = `Serie TV disponibile su vixsrc.to con ID ${tmdbId}`
                let poster_path = '/placeholder-movie.svg'
                let backdrop_path = '/placeholder-movie.svg'
                let first_air_date = ''
                let vote_average = 0

                if (jsonLdMatch) {
                    try {
                        const jsonData = JSON.parse(jsonLdMatch[1])
                        if (jsonData.description) overview = jsonData.description
                        if (jsonData.image) poster_path = jsonData.image
                        if (jsonData.datePublished) first_air_date = jsonData.datePublished
                    } catch (e) {
                        logger.warn('Errore nel parsing JSON-LD', { tmdbId, error: e })
                    }
                }

                // Cerca immagini nella pagina
                const posterMatch = html.match(/<img[^>]*src="([^"]*)"[^>]*class="[^"]*poster[^"]*"/i) ||
                    html.match(/<img[^>]*class="[^"]*poster[^"]*"[^>]*src="([^"]*)"/i)
                if (posterMatch && posterMatch[1]) {
                    poster_path = posterMatch[1].startsWith('http') ? posterMatch[1] : `${this.VIXSRC_BASE_URL}${posterMatch[1]}`
                }

                const backdropMatch = html.match(/<img[^>]*src="([^"]*)"[^>]*class="[^"]*backdrop[^"]*"/i) ||
                    html.match(/<img[^>]*class="[^"]*backdrop[^"]*"[^>]*src="([^"]*)"/i)
                if (backdropMatch && backdropMatch[1]) {
                    backdrop_path = backdropMatch[1].startsWith('http') ? backdropMatch[1] : `${this.VIXSRC_BASE_URL}${backdropMatch[1]}`
                }

                return {
                    id: tmdbId,
                    name,
                    overview,
                    poster_path,
                    backdrop_path,
                    first_air_date,
                    vote_average,
                    genre_ids: [],
                    origin_country: [],
                    original_language: 'en',
                    original_name: name,
                    popularity: 0,
                    tmdb_id: tmdbId
                }
            }

            return null
        } catch (error) {
            logger.error('Errore nel scraping dettagli serie TV da vixsrc.to', { tmdbId, error })
            return null
        }
    }
}
