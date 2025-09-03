import axios from 'axios'
import { logger } from '@/utils/logger'

export interface VideoSource {
    url: string
    quality: string
    type: 'movie' | 'tv'
    tmdbId: number
    season?: number
    episode?: number
}

export class VideoPlayerService {
    private readonly VIXSRC_BASE_URL = process.env.VIXSRC_BASE_URL || 'https://vixsrc.to'

    // Controlla se un film è disponibile su vixsrc.to
    async checkMovieAvailability(tmdbId: number): Promise<boolean> {
        try {
            // Usa il nostro endpoint API per evitare problemi CORS
            const response = await axios.get(`/api/player/check-availability?tmdbId=${tmdbId}&type=movie`, {
                timeout: 10000
            })

            if (response.status === 200 && response.data.success) {
                return response.data.data.isAvailable
            }

            return false
        } catch (error) {
            logger.warn('Errore nel controllo disponibilità film', { tmdbId, error })
            return false
        }
    }

    async getMovieVideoSource(tmdbId: number): Promise<VideoSource | null> {
        try {
            // Prima controlla se il film è disponibile
            const isAvailable = await this.checkMovieAvailability(tmdbId)
            if (!isAvailable) {
                logger.warn('Film non disponibile su vixsrc.to', { tmdbId })
                return null
            }

            // Usa il nostro endpoint API per evitare problemi CORS
            const response = await axios.get(`/api/player/movie/${tmdbId}`)

            if (response.status === 200 && response.data.success) {
                logger.info('Video source trovato per film', { tmdbId, videoUrl: response.data.data.url })
                return response.data.data
            }

            logger.warn('Nessun video source trovato per film', { tmdbId })
            return null
        } catch (error) {
            logger.error('Errore nel recupero video source per film', { error, tmdbId })
            return null
        }
    }

    // Controlla se una serie TV è disponibile su vixsrc.to
    async checkTVShowAvailability(tmdbId: number, season: number = 1, episode: number = 1): Promise<boolean> {
        try {
            // Usa il nostro endpoint API per evitare problemi CORS
            const response = await axios.get(`/api/player/check-availability?tmdbId=${tmdbId}&type=tv`, {
                timeout: 10000
            })

            if (response.status === 200 && response.data.success) {
                return response.data.data.isAvailable
            }

            return false
        } catch (error) {
            logger.warn('Errore nel controllo disponibilità serie TV', { tmdbId, season, episode, error })
            return false
        }
    }

    async getTVShowVideoSource(tmdbId: number, season: number, episode: number): Promise<VideoSource | null> {
        try {
            // Prima controlla se la serie TV è disponibile
            const isAvailable = await this.checkTVShowAvailability(tmdbId, season, episode)
            if (!isAvailable) {
                logger.warn('Serie TV non disponibile su vixsrc.to', { tmdbId, season, episode })
                return null
            }

            // Usa il nostro endpoint API per evitare problemi CORS
            const response = await axios.get(`/api/player/tv/${tmdbId}?season=${season}&episode=${episode}`)

            if (response.status === 200 && response.data.success) {
                logger.info('Video source trovato per serie TV', { tmdbId, season, episode, videoUrl: response.data.data.url })
                return response.data.data
            }

            logger.warn('Nessun video source trovato per serie TV', { tmdbId, season, episode })
            return null
        } catch (error) {
            logger.error('Errore nel recupero video source per serie TV', { error, tmdbId, season, episode })
            return null
        }
    }

    // Metodo per ottenere l'URL diretto del player di vixsrc.to
    getPlayerUrl(tmdbId: number, type: 'movie' | 'tv', season?: number, episode?: number): string {
        const baseUrl = type === 'movie'
            ? `${this.VIXSRC_BASE_URL}/movie/${tmdbId}`
            : `${this.VIXSRC_BASE_URL}/tv/${tmdbId}/${season}/${episode}`

        // Aggiungi parametri di personalizzazione secondo la documentazione VixSrc
        const params = new URLSearchParams({
            lang: 'it',                    // Lingua italiana per audio
            autoplay: 'false',            // Non autoplay per migliore UX
            primaryColor: 'B20710',       // Colore primario (rosso Netflix-style)
            secondaryColor: '170000'      // Colore secondario (rosso scuro)
        })

        return `${baseUrl}?${params.toString()}`
    }

    // Metodo per ottenere un URL di fallback quando il film non è disponibile
    getFallbackPlayerUrl(tmdbId: number, type: 'movie' | 'tv', season?: number, episode?: number): string {
        // Per ora restituiamo un URL di placeholder che mostra un messaggio di errore
        // In futuro potremmo integrare altri servizi di streaming
        const baseUrl = type === 'movie'
            ? `${this.VIXSRC_BASE_URL}/movie/${tmdbId}`
            : `${this.VIXSRC_BASE_URL}/tv/${tmdbId}/${season}/${episode}`

        return baseUrl
    }

    // Metodo per verificare se un URL è valido
    async validatePlayerUrl(url: string): Promise<boolean> {
        try {
            const response = await axios.head(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                timeout: 5000
            })
            return response.status === 200
        } catch (error) {
            return false
        }
    }
}
