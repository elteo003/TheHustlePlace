import { NextRequest, NextResponse } from 'next/server'
import { tmdbWrapperService } from '@/services/tmdb-wrapper.service'

export const dynamic = 'force-dynamic'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const tvId = parseInt(id)

        if (isNaN(tvId)) {
            return NextResponse.json({
                success: false,
                error: 'ID serie TV non valido'
            }, { status: 400 })
        }

        console.log('📺 Recupero stagioni e episodi per serie TV ID:', tvId)

        const seasonsWithEpisodes = await tmdbWrapperService.getTVShowAllSeasonsWithEpisodes(tvId)

        if (!seasonsWithEpisodes || seasonsWithEpisodes.length === 0) {
            console.log('⚠️ Nessuna stagione trovata per la serie TV:', tvId)
            return NextResponse.json({
                success: true,
                data: []
            })
        }

        console.log('✅ Stagioni trovate:', seasonsWithEpisodes.length, seasonsWithEpisodes.map((season) => season.episode_count))

        return NextResponse.json({
            success: true,
            data: seasonsWithEpisodes
        })

    } catch (error) {
        console.error('❌ Errore nel recupero stagioni serie TV:', error)

        return NextResponse.json({
            success: false,
            error: 'Errore interno del server'
        }, { status: 500 })
    }
}

