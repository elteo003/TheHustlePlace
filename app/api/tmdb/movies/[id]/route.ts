import { NextRequest, NextResponse } from 'next/server'
import { tmdbWrapperService } from '@/services/tmdb-wrapper.service'

export const dynamic = 'force-dynamic'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const movieId = parseInt(params.id)

        if (isNaN(movieId)) {
            return NextResponse.json({
                success: false,
                error: 'ID film non valido'
            }, { status: 400 })
        }

        console.log('🎬 Recupero dettagli film TMDB per ID:', movieId)

        // Ottieni i dettagli del film da TMDB
        const movieDetails = await tmdbWrapperService.getMovieDetails(movieId)

        if (!movieDetails) {
            return NextResponse.json({
                success: false,
                error: 'Film non trovato'
            }, { status: 404 })
        }

        console.log('✅ Film trovato:', movieDetails.title)

        return NextResponse.json({
            success: true,
            data: movieDetails
        })

    } catch (error) {
        console.error('❌ Errore nel recupero dettagli film:', error)

        return NextResponse.json({
            success: false,
            error: 'Errore interno del server'
        }, { status: 500 })
    }
}

