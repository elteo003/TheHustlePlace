import { NextRequest, NextResponse } from 'next/server'
import { fetchFromTMDB } from '@/lib/tmdb'

export async function GET(request: NextRequest) {
    try {
        const trendingResponse = await fetchFromTMDB('trending/all/week')
        const top10 = ((trendingResponse as any).results || [])
            .filter((item: { media_type?: string }) => item.media_type === 'movie' || item.media_type === 'tv')
            .slice(0, 10)

        let movieList = "TOP 10 GLOBALE DELLA SETTIMANA:\n\n"

        top10.forEach((item: any, index: number) => {
            movieList += `${index + 1}. ${item.title || item.name} (${item.media_type})\n`
            movieList += `   Popolarita: ${Math.round(item.popularity)}\n`
            movieList += `   Voto: ${item.vote_average}/10\n`
            movieList += `   Uscita: ${item.release_date || item.first_air_date}\n\n`
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

