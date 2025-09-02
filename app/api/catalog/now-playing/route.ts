import { NextRequest, NextResponse } from 'next/server'
import { CatalogService } from '@/services/catalog.service'

const catalogService = new CatalogService()

export async function GET(request: NextRequest) {
    try {
        const movies = await catalogService.getNowPlayingMovies()
        
        return NextResponse.json({
            success: true,
            data: movies
        })
    } catch (error) {
        console.error('Errore nel recupero film now playing:', error)
        return NextResponse.json(
            { success: false, error: 'Errore nel recupero dei film' },
            { status: 500 }
        )
    }
}
