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

    async getMovieVideoSource(tmdbId: number): Promise<VideoSource | null> {
        try {
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

    async getTVShowVideoSource(tmdbId: number, season: number, episode: number): Promise<VideoSource | null> {
        try {
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
}
