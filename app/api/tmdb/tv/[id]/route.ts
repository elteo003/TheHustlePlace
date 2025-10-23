import { NextRequest, NextResponse } from 'next/server'
import { tmdbWrapperService } from '@/services/tmdb-wrapper.service'

export const dynamic = 'force-dynamic'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const tvId = parseInt(params.id)

        if (isNaN(tvId)) {
            return NextResponse.json({
                success: false,
                error: 'ID serie TV non valido'
            }, { status: 400 })
        }

        console.log('📺 Recupero dettagli serie TV TMDB per ID:', tvId)

        // Ottieni i dettagli della serie TV da TMDB
        const tvShowDetails = await tmdbWrapperService.getTVShowDetails(tvId)

        if (!tvShowDetails) {
            return NextResponse.json({
                success: false,
                error: 'Serie TV non trovata'
            }, { status: 404 })
        }

        console.log('✅ Serie TV trovata:', tvShowDetails.name)

        return NextResponse.json({
            success: true,
            data: tvShowDetails
        })

    } catch (error) {
        console.error('❌ Errore nel recupero dettagli serie TV:', error)

        return NextResponse.json({
            success: false,
            error: 'Errore interno del server'
        }, { status: 500 })
    }
}
