import { NextRequest, NextResponse } from 'next/server'
import { tmdbWrapperService } from '@/services/tmdb-wrapper.service'

export const dynamic = 'force-dynamic'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const movieId = parseInt(id)

        if (isNaN(movieId)) {
            return NextResponse.json({
                success: false,
                error: 'ID film non valido'
            }, { status: 400 })
        }

        console.log('🎬 Recupero video per film TMDB ID:', movieId)

        const videos = await tmdbWrapperService.getMovieVideos(movieId)

        if (!videos) {
            return NextResponse.json({
                success: false,
                error: 'Video non trovati'
            }, { status: 404 })
        }

        console.log('✅ Video trovati:', videos?.results?.length || 0)

        return NextResponse.json({
            success: true,
            data: videos
        })

    } catch (error) {
        console.error('❌ Errore nel recupero video film:', error)

        return NextResponse.json({
            success: false,
            error: 'Errore interno del server'
        }, { status: 500 })
    }
}
