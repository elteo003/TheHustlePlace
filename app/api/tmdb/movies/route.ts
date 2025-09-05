import { NextRequest, NextResponse } from 'next/server'
import { tmdbWrapperService } from '@/services/tmdb-wrapper.service'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type') || 'popular'
        const page = parseInt(searchParams.get('page') || '1')

        let movies = []

        switch (type) {
            case 'popular':
                movies = await tmdbWrapperService.getTop10Movies()
                break
            case 'top-rated':
                const topRated = await tmdbWrapperService.getTopRatedMovies(page)
                movies = topRated?.results || []
                break
            case 'now-playing':
                movies = await tmdbWrapperService.getThisWeekMovies()
                break
            case 'upcoming':
                const upcoming = await tmdbWrapperService.getUpcomingMovies(page)
                movies = upcoming?.results || []
                break
            default:
                movies = await tmdbWrapperService.getTop10Movies()
        }

        return NextResponse.json({
            success: true,
            data: movies
        })

    } catch (error) {
        console.error('Errore API TMDB movies:', error)

        return NextResponse.json(
            {
                success: false,
                error: 'Errore nel recupero dei film',
                message: error instanceof Error ? error.message : 'Errore sconosciuto'
            },
            { status: 500 }
        )
    }
}
