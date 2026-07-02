import { NextRequest, NextResponse } from 'next/server'
import { checkVixsrcAvailability } from '@/services/availability.service'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const tmdbId = searchParams.get('tmdbId')
        const type = (searchParams.get('type') || 'movie') as 'movie' | 'tv'
        const season = searchParams.get('season') ? parseInt(searchParams.get('season')!, 10) : undefined
        const episode = searchParams.get('episode') ? parseInt(searchParams.get('episode')!, 10) : undefined

        if (!tmdbId) {
            return NextResponse.json({ success: false, error: 'TMDB ID mancante' }, { status: 400 })
        }

        const parsedId = parseInt(tmdbId, 10)
        const isAvailable = await checkVixsrcAvailability(parsedId, type, season, episode)

        return NextResponse.json({
            success: true,
            data: {
                tmdbId: parsedId,
                type,
                isAvailable,
            },
        })
    } catch (error) {
        const { searchParams } = new URL(request.url)

        return NextResponse.json(
            {
                success: false,
                error: 'Errore nel controllo disponibilità',
                data: {
                    tmdbId: searchParams.get('tmdbId'),
                    type: searchParams.get('type') || 'movie',
                    isAvailable: false,
                },
            },
            { status: 500 }
        )
    }
}
