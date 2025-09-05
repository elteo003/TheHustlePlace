import { NextRequest, NextResponse } from 'next/server'
import { fetchFromTMDB } from '@/lib/tmdb'

export async function GET(request: NextRequest) {
    try {
        // Recupera film trending del giorno
        const trendingResponse = await fetchFromTMDB('trending/movie/day')

        // Ordina per popularity e prendi i primi 10
        const top10Movies = (trendingResponse as any).results
            .sort((a: any, b: any) => b.popularity - a.popularity)
            .slice(0, 10)

        // Formatta i risultati in modo leggibile
        const movieNames = top10Movies.map((movie: any, index: number) => ({
            rank: index + 1,
            title: movie.title,
            popularity: Math.round(movie.popularity),
            vote_average: movie.vote_average,
            release_date: movie.release_date
        }))

        return NextResponse.json({
            success: true,
            message: "Top 10 Film del Giorno (ordinati per popolarità)",
            movies: movieNames
        })

    } catch (error) {
        console.error('❌ Errore:', error)
        return NextResponse.json({
            success: false,
            error: 'Errore nel recupero dei dati'
        }, { status: 500 })
    }
}

