import { NextResponse } from 'next/server'
import { CatalogService } from '@/services/catalog.service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
    try {
        const catalogService = new CatalogService()
        const top10 = await catalogService.getTop10Mixed()
        return NextResponse.json({
            success: true,
            data: {
                total: top10.length,
                movies: top10.map((item, index) => ({
                    rank: index + 1,
                    title: item.title,
                    type: item.type,
                    popularity: item.popularity,
                    vote_average: item.vote_average,
                    release_date: item.release_date || item.first_air_date,
                    id: item.id,
                })),
            },
        })
    } catch {
        return NextResponse.json({ success: false, error: 'Errore nel recupero dei dati Top 10' }, { status: 500 })
    }
}
