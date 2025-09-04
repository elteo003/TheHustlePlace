/**
 * Trakt.tv API Service
 * 
 * Servizio moderno per l'integrazione con Trakt.tv API
 * Fornisce accesso a film popolari, serie TV e nuove uscite
 * con cache Redis per ottimizzare le performance
 * 
 * @author Streaming Platform
 * @version 1.0.0
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { createClient, RedisClientType } from 'redis'
import { logger } from '@/utils/logger'

// Tipi per i dati Trakt.tv
export interface TraktMovie {
    title: string
    year: number
    ids: {
        trakt: number
        slug: string
        imdb: string
        tmdb: number
    }
    overview: string
    rating: number
    votes: number
    genres: string[]
    runtime: number
    certification: string
    network: string
    country: string
    language: string
    homepage: string
    status: string
    trailer: string
    images: {
        poster: {
            full: string
            medium: string
            thumb: string
        }
        fanart: {
            full: string
            medium: string
            thumb: string
        }
    }
}

export interface TraktShow {
    title: string
    year: number
    ids: {
        trakt: number
        slug: string
        imdb: string
        tmdb: number
        tvdb: number
    }
    overview: string
    rating: number
    votes: number
    genres: string[]
    runtime: number
    certification: string
    network: string
    country: string
    language: string
    homepage: string
    status: string
    trailer: string
    images: {
        poster: {
            full: string
            medium: string
            thumb: string
        }
        fanart: {
            full: string
            medium: string
            thumb: string
        }
    }
}

export interface TraktUpcomingMovie {
    movie: TraktMovie
    released: string
    country: string
}

// Configurazione del servizio
interface TraktConfig {
    clientId: string
    clientSecret: string
    baseUrl: string
    apiVersion: string
    redisUrl: string
    cacheTTL: number
}

class TraktService {
    private client: AxiosInstance
    private redis: RedisClientType
    private config: TraktConfig
    private isRedisConnected: boolean = false

    constructor() {
        this.config = {
            clientId: process.env.TRAKT_CLIENT_ID || '',
            clientSecret: process.env.TRAKT_CLIENT_SECRET || '',
            baseUrl: 'https://api.trakt.tv',
            apiVersion: '2',
            redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
            cacheTTL: 3600 // 1 ora in secondi
        }

        // Inizializza client Axios per Trakt.tv
        this.client = axios.create({
            baseURL: this.config.baseUrl,
            headers: {
                'Content-Type': 'application/json',
                'trakt-api-version': this.config.apiVersion,
                'trakt-api-key': this.config.clientId
            },
            timeout: 10000
        })

        // Inizializza Redis
        this.redis = createClient({
            url: this.config.redisUrl
        })

        this.initializeRedis()
    }

    /**
     * Inizializza la connessione Redis
     * Gestisce errori di connessione senza bloccare il servizio
     */
    private async initializeRedis(): Promise<void> {
        try {
            await this.redis.connect()
            this.isRedisConnected = true
            logger.info('Redis connesso con successo per Trakt.tv cache')
        } catch (error) {
            logger.warn('Redis non disponibile per Trakt.tv cache:', error)
            this.isRedisConnected = false
        }
    }

    /**
     * Recupera dati dalla cache Redis
     * @param key - Chiave della cache
     * @returns Dati cached o null se non trovati
     */
    private async getFromCache<T>(key: string): Promise<T | null> {
        if (!this.isRedisConnected) return null

        try {
            const cached = await this.redis.get(key)
            if (cached) {
                logger.info(`Cache hit per chiave: ${key}`)
                return JSON.parse(cached)
            }
        } catch (error) {
            logger.error(`Errore lettura cache Redis per ${key}:`, error)
        }
        return null
    }

    /**
     * Salva dati nella cache Redis
     * @param key - Chiave della cache
     * @param data - Dati da salvare
     * @param ttl - Time to live in secondi
     */
    private async setCache<T>(key: string, data: T, ttl: number = this.config.cacheTTL): Promise<void> {
        if (!this.isRedisConnected) return

        try {
            await this.redis.setEx(key, ttl, JSON.stringify(data))
            logger.info(`Dati salvati in cache per chiave: ${key} (TTL: ${ttl}s)`)
        } catch (error) {
            logger.error(`Errore salvataggio cache Redis per ${key}:`, error)
        }
    }

    /**
     * Formatta i dati del film per il frontend
     * @param movie - Dati grezzi da Trakt.tv
     * @returns Dati formattati per il frontend
     */
    private formatMovieData(movie: any): TraktMovie {
        return {
            title: movie.title || 'Titolo non disponibile',
            year: movie.year || new Date().getFullYear(),
            ids: {
                trakt: movie.ids?.trakt || 0,
                slug: movie.ids?.slug || '',
                imdb: movie.ids?.imdb || '',
                tmdb: movie.ids?.tmdb || 0
            },
            overview: movie.overview || 'Descrizione non disponibile',
            rating: movie.rating || 0,
            votes: movie.votes || 0,
            genres: movie.genres || [],
            runtime: movie.runtime || 0,
            certification: movie.certification || '',
            network: movie.network || '',
            country: movie.country || '',
            language: movie.language || 'en',
            homepage: movie.homepage || '',
            status: movie.status || '',
            trailer: movie.trailer || '',
            images: {
                poster: {
                    full: movie.images?.poster?.full || '',
                    medium: movie.images?.poster?.medium || '',
                    thumb: movie.images?.poster?.thumb || ''
                },
                fanart: {
                    full: movie.images?.fanart?.full || '',
                    medium: movie.images?.fanart?.medium || '',
                    thumb: movie.images?.fanart?.thumb || ''
                }
            }
        }
    }

    /**
     * Formatta i dati della serie TV per il frontend
     * @param show - Dati grezzi da Trakt.tv
     * @returns Dati formattati per il frontend
     */
    private formatShowData(show: any): TraktShow {
        return {
            title: show.title || 'Titolo non disponibile',
            year: show.year || new Date().getFullYear(),
            ids: {
                trakt: show.ids?.trakt || 0,
                slug: show.ids?.slug || '',
                imdb: show.ids?.imdb || '',
                tmdb: show.ids?.tmdb || 0,
                tvdb: show.ids?.tvdb || 0
            },
            overview: show.overview || 'Descrizione non disponibile',
            rating: show.rating || 0,
            votes: show.votes || 0,
            genres: show.genres || [],
            runtime: show.runtime || 0,
            certification: show.certification || '',
            network: show.network || '',
            country: show.country || '',
            language: show.language || 'en',
            homepage: show.homepage || '',
            status: show.status || '',
            trailer: show.trailer || '',
            images: {
                poster: {
                    full: show.images?.poster?.full || '',
                    medium: show.images?.poster?.medium || '',
                    thumb: show.images?.poster?.thumb || ''
                },
                fanart: {
                    full: show.images?.fanart?.full || '',
                    medium: show.images?.fanart?.medium || '',
                    thumb: show.images?.fanart?.thumb || ''
                }
            }
        }
    }

    /**
     * Recupera i top 10 film popolari da Trakt.tv
     * Prima controlla la cache, poi l'API se necessario
     * @returns Array di film formattati per il frontend
     */
    async getTop10Movies(): Promise<TraktMovie[]> {
        const cacheKey = 'trakt:top10:movies'
        
        try {
            // Controlla cache prima
            const cached = await this.getFromCache<TraktMovie[]>(cacheKey)
            if (cached) {
                return cached
            }

            logger.info('Recupero top 10 film da Trakt.tv API...')
            
            // Chiamata API Trakt.tv
            const response: AxiosResponse = await this.client.get('/movies/popular', {
                params: {
                    limit: 10,
                    extended: 'full'
                }
            })

            // Formatta i dati
            const movies: TraktMovie[] = response.data.map((movie: any) => 
                this.formatMovieData(movie)
            )

            // Salva in cache
            await this.setCache(cacheKey, movies)

            logger.info(`Recuperati ${movies.length} film popolari da Trakt.tv`)
            return movies

        } catch (error) {
            logger.error('Errore nel recupero top 10 film da Trakt.tv:', error)
            
            // Fallback: restituisci array vuoto invece di bloccare
            return []
        }
    }

    /**
     * Recupera i top 10 serie TV popolari da Trakt.tv
     * Prima controlla la cache, poi l'API se necessario
     * @returns Array di serie TV formattate per il frontend
     */
    async getTop10Shows(): Promise<TraktShow[]> {
        const cacheKey = 'trakt:top10:shows'
        
        try {
            // Controlla cache prima
            const cached = await this.getFromCache<TraktShow[]>(cacheKey)
            if (cached) {
                return cached
            }

            logger.info('Recupero top 10 serie TV da Trakt.tv API...')
            
            // Chiamata API Trakt.tv
            const response: AxiosResponse = await this.client.get('/shows/popular', {
                params: {
                    limit: 10,
                    extended: 'full'
                }
            })

            // Formatta i dati
            const shows: TraktShow[] = response.data.map((show: any) => 
                this.formatShowData(show)
            )

            // Salva in cache
            await this.setCache(cacheKey, shows)

            logger.info(`Recuperate ${shows.length} serie TV popolari da Trakt.tv`)
            return shows

        } catch (error) {
            logger.error('Errore nel recupero top 10 serie TV da Trakt.tv:', error)
            
            // Fallback: restituisci array vuoto invece di bloccare
            return []
        }
    }

    /**
     * Recupera le nuove uscite cinema per il prossimo mese
     * Prima controlla la cache, poi l'API se necessario
     * @returns Array di film in uscita formattati per il frontend
     */
    async getUpcomingMovies(): Promise<TraktUpcomingMovie[]> {
        const cacheKey = 'trakt:upcoming:movies'
        
        try {
            // Controlla cache prima
            const cached = await this.getFromCache<TraktUpcomingMovie[]>(cacheKey)
            if (cached) {
                return cached
            }

            logger.info('Recupero nuove uscite cinema da Trakt.tv API...')
            
            // Calcola date per il prossimo mese
            const startDate = new Date()
            const endDate = new Date()
            endDate.setMonth(endDate.getMonth() + 1)
            
            const startStr = startDate.toISOString().split('T')[0]
            const endStr = endDate.toISOString().split('T')[0]

            // Chiamata API Trakt.tv
            const response: AxiosResponse = await this.client.get(
                `/calendars/movies/premieres/${startStr}/${endStr}`,
                {
                    params: {
                        extended: 'full'
                    }
                }
            )

            // Formatta i dati
            const upcomingMovies: TraktUpcomingMovie[] = response.data.map((item: any) => ({
                movie: this.formatMovieData(item.movie),
                released: item.released || '',
                country: item.country || ''
            }))

            // Salva in cache
            await this.setCache(cacheKey, upcomingMovies)

            logger.info(`Recuperate ${upcomingMovies.length} nuove uscite da Trakt.tv`)
            return upcomingMovies

        } catch (error) {
            logger.error('Errore nel recupero nuove uscite da Trakt.tv:', error)
            
            // Fallback: restituisci array vuoto invece di bloccare
            return []
        }
    }

    /**
     * Chiude le connessioni Redis
     * Da chiamare quando l'applicazione si spegne
     */
    async disconnect(): Promise<void> {
        if (this.isRedisConnected) {
            try {
                await this.redis.disconnect()
                logger.info('Connessione Redis Trakt.tv chiusa')
            } catch (error) {
                logger.error('Errore chiusura connessione Redis Trakt.tv:', error)
            }
        }
    }
}

// Istanza singleton del servizio
const traktService = new TraktService()

// Esporta le funzioni principali
export const getTop10Movies = () => traktService.getTop10Movies()
export const getTop10Shows = () => traktService.getTop10Shows()
export const getUpcomingMovies = () => traktService.getUpcomingMovies()

// Esporta anche l'istanza per gestione avanzata
export { traktService }

// Gestione graceful shutdown
process.on('SIGINT', async () => {
    await traktService.disconnect()
    process.exit(0)
})

process.on('SIGTERM', async () => {
    await traktService.disconnect()
    process.exit(0)
})
