import { NextRequest, NextResponse } from 'next/server'
import { CatalogService } from '@/services/catalog.service'
import { withRateLimit } from '@/middlewares/rate-limit.middleware'

const catalogService = new CatalogService()

async function handler(request: NextRequest) {
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

// Rate limit: 50 requests per 15 minutes
export const GET = withRateLimit(handler, {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 50,
    message: 'Troppe richieste per i film now playing, riprova più tardi'
})
