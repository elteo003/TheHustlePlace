import { NextRequest, NextResponse } from 'next/server'
import { CatalogService } from '@/services/catalog.service'

const catalogService = new CatalogService()

export async function GET(request: NextRequest) {
    try {
        const top10Content = await catalogService.getTop10Mixed()

        return NextResponse.json({
            success: true,
            data: top10Content
        })
    } catch (error) {
        console.error('Errore nel recupero top 10 mista:', error)
        return NextResponse.json(
            { success: false, error: 'Errore nel recupero della top 10 mista' },
            { status: 500 }
        )
    }
}
