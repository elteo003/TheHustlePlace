import { NextRequest, NextResponse } from 'next/server'
import { checkEpisodesAvailability, EpisodeRef } from '@/services/availability.service'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const tmdbId = Number(body?.tmdbId)
        const episodes = body?.episodes as EpisodeRef[] | undefined

        if (!tmdbId || Number.isNaN(tmdbId)) {
            return NextResponse.json({ success: false, error: 'TMDB ID non valido' }, { status: 400 })
        }

        if (!Array.isArray(episodes) || episodes.length === 0) {
            return NextResponse.json({ success: false, error: 'Lista episodi mancante' }, { status: 400 })
        }

        if (episodes.length > 500) {
            return NextResponse.json(
                { success: false, error: 'Troppi episodi in una singola richiesta (max 500)' },
                { status: 400 }
            )
        }

        const availability = await checkEpisodesAvailability(tmdbId, episodes)

        return NextResponse.json({
            success: true,
            data: { tmdbId, availability },
        })
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Errore nel controllo batch',
            },
            { status: 500 }
        )
    }
}
