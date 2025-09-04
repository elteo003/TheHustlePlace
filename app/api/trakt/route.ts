/**
 * Trakt.tv API Endpoint
 * 
 * Endpoint per recuperare dati da Trakt.tv
 * Fornisce accesso a film popolari, serie TV e nuove uscite
 * con cache Redis per ottimizzare le performance
 * 
 * @author Streaming Platform
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTop10Movies, getTop10Shows, getUpcomingMovies } from '@/services/trakt.service'
import { logger } from '@/utils/logger'

/**
 * GET /api/trakt
 * 
 * Recupera dati da Trakt.tv basati sui parametri di query
 * 
 * Query parameters:
 * - type: 'movies' | 'shows' | 'upcoming' | 'all'
 * - limit: numero di risultati (default: 10)
 * 
 * @param request - Richiesta HTTP
 * @returns Risposta JSON con i dati richiesti
 */
export async function GET(request: NextRequest) {
    const startTime = Date.now()
    
    try {
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type') || 'all'
        const limit = parseInt(searchParams.get('limit') || '10')

        logger.info(`Richiesta Trakt.tv API - Tipo: ${type}, Limite: ${limit}`)

        let responseData: any = {
            success: true,
            timestamp: new Date().toISOString(),
            source: 'trakt.tv',
            processingTime: 0
        }

        // Recupera dati basati sul tipo richiesto
        switch (type) {
            case 'movies':
                const movies = await getTop10Movies()
                responseData.data = {
                    movies: movies.slice(0, limit),
                    total: movies.length
                }
                break

            case 'shows':
                const shows = await getTop10Shows()
                responseData.data = {
                    shows: shows.slice(0, limit),
                    total: shows.length
                }
                break

            case 'upcoming':
                const upcoming = await getUpcomingMovies()
                responseData.data = {
                    upcoming: upcoming.slice(0, limit),
                    total: upcoming.length
                }
                break

            case 'all':
                // Recupera tutti i dati in parallelo per performance ottimali
                const [allMovies, allShows, allUpcoming] = await Promise.all([
                    getTop10Movies(),
                    getTop10Shows(),
                    getUpcomingMovies()
                ])

                responseData.data = {
                    movies: allMovies.slice(0, limit),
                    shows: allShows.slice(0, limit),
                    upcoming: allUpcoming.slice(0, limit),
                    totals: {
                        movies: allMovies.length,
                        shows: allShows.length,
                        upcoming: allUpcoming.length
                    }
                }
                break

            default:
                return NextResponse.json({
                    success: false,
                    error: 'Tipo non valido. Usa: movies, shows, upcoming, o all',
                    validTypes: ['movies', 'shows', 'upcoming', 'all']
                }, { status: 400 })
        }

        // Calcola tempo di elaborazione
        responseData.processingTime = Date.now() - startTime

        logger.info(`Trakt.tv API completata in ${responseData.processingTime}ms`)

        return NextResponse.json(responseData, {
            status: 200,
            headers: {
                'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache per 1 ora
                'Content-Type': 'application/json'
            }
        })

    } catch (error) {
        const processingTime = Date.now() - startTime
        
        logger.error('Errore Trakt.tv API endpoint:', error)

        return NextResponse.json({
            success: false,
            error: 'Errore interno del server',
            message: error instanceof Error ? error.message : 'Errore sconosciuto',
            processingTime,
            timestamp: new Date().toISOString()
        }, { status: 500 })
    }
}

/**
 * POST /api/trakt
 * 
 * Endpoint per operazioni avanzate (futuro)
 * Attualmente non implementato
 * 
 * @param request - Richiesta HTTP
 * @returns Risposta JSON con errore
 */
export async function POST(request: NextRequest) {
    return NextResponse.json({
        success: false,
        error: 'Metodo POST non implementato',
        message: 'Usa GET per recuperare dati da Trakt.tv'
    }, { status: 405 })
}

/**
 * PUT /api/trakt
 * 
 * Endpoint per operazioni di aggiornamento (futuro)
 * Attualmente non implementato
 * 
 * @param request - Richiesta HTTP
 * @returns Risposta JSON con errore
 */
export async function PUT(request: NextRequest) {
    return NextResponse.json({
        success: false,
        error: 'Metodo PUT non implementato',
        message: 'Usa GET per recuperare dati da Trakt.tv'
    }, { status: 405 })
}

/**
 * DELETE /api/trakt
 * 
 * Endpoint per operazioni di eliminazione (futuro)
 * Attualmente non implementato
 * 
 * @param request - Richiesta HTTP
 * @returns Risposta JSON con errore
 */
export async function DELETE(request: NextRequest) {
    return NextResponse.json({
        success: false,
        error: 'Metodo DELETE non implementato',
        message: 'Usa GET per recuperare dati da Trakt.tv'
    }, { status: 405 })
}
