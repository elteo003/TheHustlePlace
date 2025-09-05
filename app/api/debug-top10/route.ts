import { NextRequest, NextResponse } from 'next/server'
import { fetchFromTMDB } from '@/lib/tmdb'

export async function GET(request: NextRequest) {
    try {
        console.log('🔍 Debug Top 10 - Recupero film trending...')

        // Recupera film trending del giorno
        const trendingResponse = await fetchFromTMDB('trending/movie/day')
        console.log('📊 Risposta API:', trendingResponse)

        // Ordina per popularity e prendi i primi 10
        const top10Movies = (trendingResponse as any).results
            .sort((a: any, b: any) => b.popularity - a.popularity)
            .slice(0, 10)

        console.log('🏆 Top 10 film:')
        top10Movies.forEach((movie: any, index: number) => {
            console.log(`${index + 1}. ${movie.title} (Popularity: ${movie.popularity})`)
        })

        return NextResponse.json({
            success: true,
            data: {
                total: top10Movies.length,
                movies: top10Movies.map((movie: any, index: number) => ({
                    rank: index + 1,
                    title: movie.title,
                    popularity: movie.popularity,
                    vote_average: movie.vote_average,
                    release_date: movie.release_date,
                    id: movie.id
                }))
            }
        })

    } catch (error) {
        console.error('❌ Errore debug Top 10:', error)
        return NextResponse.json({
            success: false,
            error: 'Errore nel recupero dei dati Top 10'
        }, { status: 500 })
    }
}

