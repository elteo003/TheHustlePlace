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

        // Crea lista leggibile
        let movieList = "🏆 TOP 10 FILM DEL GIORNO (per popolarità):\n\n"

        top10Movies.forEach((movie: any, index: number) => {
            movieList += `${index + 1}. ${movie.title}\n`
            movieList += `   📊 Popolarità: ${Math.round(movie.popularity)}\n`
            movieList += `   ⭐ Voto: ${movie.vote_average}/10\n`
            movieList += `   📅 Uscita: ${movie.release_date}\n\n`
        })

        return new NextResponse(movieList, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8'
            }
        })

    } catch (error) {
        console.error('❌ Errore:', error)
        return new NextResponse('Errore nel recupero dei dati', { status: 500 })
    }
}

