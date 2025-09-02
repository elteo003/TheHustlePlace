import axios from 'axios'
import { cache } from '@/utils/cache'
import { logger } from '@/utils/logger'

export interface PlayerEmbed {
    url: string
    quality: string
    type: 'movie' | 'tv'
    tmdbId: number
    season?: number
    episode?: number
}

export class PlayerService {
    private readonly VIXSRC_BASE_URL = process.env.VIXSRC_BASE_URL || 'https://vixsrc.to'
    private readonly CACHE_TTL = 1800 // 30 minutes

    async getMovieEmbed(tmdbId: number): Promise<PlayerEmbed> {
        try {
            const cacheKey = `movie_embed_${tmdbId}`

            // Controlla la cache
            const cached = await cache.get<PlayerEmbed>(cacheKey)
            if (cached) {
                return cached
            }

            const embedUrl = `${this.VIXSRC_BASE_URL}/movie/${tmdbId}`

            // Verifica che l'embed sia disponibile
            const response = await axios.head(embedUrl)

            if (response.status !== 200) {
                throw new Error(`Embed non disponibile: ${response.status}`)
            }

            const embed: PlayerEmbed = {
                url: embedUrl,
                quality: 'HD',
                type: 'movie',
                tmdbId
            }

            // Salva in cache
            await cache.set(cacheKey, embed, { ttl: this.CACHE_TTL })

            logger.info('Embed film recuperato con successo', { tmdbId })

            return embed
        } catch (error) {
            logger.error('Errore nel recupero embed film', { error, tmdbId })
            throw new Error('Errore nel recupero del player per il film')
        }
    }

    async getTVShowEmbed(tmdbId: number, season: number, episode: number): Promise<PlayerEmbed> {
        try {
            const cacheKey = `tv_embed_${tmdbId}_${season}_${episode}`

            // Controlla la cache
            const cached = await cache.get<PlayerEmbed>(cacheKey)
            if (cached) {
                return cached
            }

            const embedUrl = `${this.VIXSRC_BASE_URL}/tv/${tmdbId}/${season}/${episode}`

            // Verifica che l'embed sia disponibile
            const response = await axios.head(embedUrl)

            if (response.status !== 200) {
                throw new Error(`Embed non disponibile: ${response.status}`)
            }

            const embed: PlayerEmbed = {
                url: embedUrl,
                quality: 'HD',
                type: 'tv',
                tmdbId,
                season,
                episode
            }

            // Salva in cache
            await cache.set(cacheKey, embed, { ttl: this.CACHE_TTL })

            logger.info('Embed serie TV recuperato con successo', { tmdbId, season, episode })

            return embed
        } catch (error) {
            logger.error('Errore nel recupero embed serie TV', { error, tmdbId, season, episode })
            throw new Error('Errore nel recupero del player per la serie TV')
        }
    }

    async getEmbed(tmdbId: number, type: 'movie' | 'tv', season?: number, episode?: number): Promise<PlayerEmbed> {
        if (type === 'movie') {
            return this.getMovieEmbed(tmdbId)
        } else if (type === 'tv' && season && episode) {
            return this.getTVShowEmbed(tmdbId, season, episode)
        } else {
            throw new Error('Parametri mancanti per il tipo TV')
        }
    }

    generatePlayerUrl(embed: PlayerEmbed, options: {
        primaryColor?: string
        secondaryColor?: string
        autoplay?: boolean
        startAt?: number
        lang?: string
    } = {}): string {
        const url = new URL(embed.url)

        if (options.primaryColor) {
            url.searchParams.set('primaryColor', options.primaryColor)
        }

        if (options.secondaryColor) {
            url.searchParams.set('secondaryColor', options.secondaryColor)
        }

        if (options.autoplay) {
            url.searchParams.set('autoplay', 'true')
        }

        if (options.startAt) {
            url.searchParams.set('startAt', options.startAt.toString())
        }

        if (options.lang) {
            url.searchParams.set('lang', options.lang)
        }

        return url.toString()
    }

    // Metodo per gestire gli eventi del player
    handlePlayerEvent(event: MessageEvent, callbacks: {
        onPlay?: () => void
        onPause?: () => void
        onSeeked?: (time: number) => void
        onEnded?: () => void
        onTimeUpdate?: (time: number) => void
    }): void {
        try {
            if (!event.data || typeof event.data !== 'object') {
                return
            }

            const { type, data } = event.data

            switch (type) {
                case 'play':
                    callbacks.onPlay?.()
                    break
                case 'pause':
                    callbacks.onPause?.()
                    break
                case 'seeked':
                    if (typeof data?.time === 'number') {
                        callbacks.onSeeked?.(data.time)
                    }
                    break
                case 'ended':
                    callbacks.onEnded?.()
                    break
                case 'timeupdate':
                    if (typeof data?.time === 'number') {
                        callbacks.onTimeUpdate?.(data.time)
                    }
                    break
                default:
                    logger.debug('Evento player non gestito', { type, data })
            }
        } catch (error) {
            logger.error('Errore nella gestione evento player', { error, event })
        }
    }
}
