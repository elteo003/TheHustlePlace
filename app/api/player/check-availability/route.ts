import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const tmdbId = searchParams.get('tmdbId')
        const type = searchParams.get('type') || 'movie'

        if (!tmdbId) {
            return NextResponse.json({
                success: false,
                error: 'TMDB ID mancante'
            }, { status: 400 })
        }

        const vixsrcUrl = type === 'movie'
            ? `https://vixsrc.to/movie/${tmdbId}`
            : `https://vixsrc.to/tv/${tmdbId}/1/1`

        console.log('Controllo disponibilità per:', { tmdbId, type, vixsrcUrl })

        // Fai una richiesta HEAD per verificare se la risorsa esiste
        const response = await fetch(vixsrcUrl, {
            method: 'HEAD',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        })

        const isAvailable = response.status === 200

        console.log('Risultato controllo disponibilità:', { tmdbId, type, isAvailable, status: response.status })

        return NextResponse.json({
            success: true,
            data: {
                tmdbId: parseInt(tmdbId),
                type,
                isAvailable,
                url: vixsrcUrl,
                status: response.status
            }
        })

    } catch (error) {
        console.error('Errore nel controllo disponibilità:', error)

        const { searchParams } = new URL(request.url)

        return NextResponse.json({
            success: false,
            error: 'Errore nel controllo disponibilità',
            data: {
                tmdbId: searchParams.get('tmdbId'),
                type: searchParams.get('type') || 'movie',
                isAvailable: false
            }
        }, { status: 500 })
    }
}
