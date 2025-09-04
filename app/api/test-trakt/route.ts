/**
 * Test Endpoint per Trakt.tv
 * 
 * Endpoint temporaneo per testare l'integrazione Trakt.tv
 * e verificare che i dati vengano recuperati correttamente
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTop10Movies, getTop10Shows, getUpcomingMovies } from '@/services/trakt.service'
import { logger } from '@/utils/logger'

export async function GET(request: NextRequest) {
    try {
        logger.info('Test Trakt.tv API endpoint chiamato')

        // Test tutte le funzioni Trakt.tv
        const [movies, shows, upcoming] = await Promise.all([
            getTop10Movies(),
            getTop10Shows(),
            getUpcomingMovies()
        ])

        return NextResponse.json({
            success: true,
            message: 'Test Trakt.tv completato',
            data: {
                movies: {
                    count: movies.length,
                    sample: movies.slice(0, 3).map(m => ({
                        title: m.title,
                        year: m.year,
                        rating: m.rating,
                        tmdb_id: m.ids.tmdb
                    }))
                },
                shows: {
                    count: shows.length,
                    sample: shows.slice(0, 3).map(s => ({
                        title: s.title,
                        year: s.year,
                        rating: s.rating,
                        tmdb_id: s.ids.tmdb
                    }))
                },
                upcoming: {
                    count: upcoming.length,
                    sample: upcoming.slice(0, 3).map(u => ({
                        title: u.movie.title,
                        year: u.movie.year,
                        released: u.released
                    }))
                }
            },
            timestamp: new Date().toISOString()
        })

    } catch (error) {
        logger.error('Errore nel test Trakt.tv:', error)
        
        return NextResponse.json({
            success: false,
            error: 'Errore nel test Trakt.tv',
            message: error instanceof Error ? error.message : 'Errore sconosciuto',
            timestamp: new Date().toISOString()
        }, { status: 500 })
    }
}
