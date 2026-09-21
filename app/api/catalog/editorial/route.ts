import { NextResponse } from 'next/server'
import { CatalogService } from '@/services/catalog.service'
import { fetchEditorialRails } from '@/lib/server/catalog'
import { CINEMA_RAIL_SIZE, HOME_RAIL_SIZE } from '@/lib/catalog-types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const catalogService = new CatalogService()

export async function GET() {
    try {
        const [top10, comingSoon, cinema] = await Promise.all([
            catalogService.getTop10Mixed(),
            catalogService.getComingSoon(HOME_RAIL_SIZE),
            catalogService.getComingToCinema(CINEMA_RAIL_SIZE),
        ])
        const editorial = await fetchEditorialRails([...top10, ...cinema, ...comingSoon])
        return NextResponse.json({ success: true, data: editorial })
    } catch {
        return NextResponse.json({ success: false, error: 'editorial_rails_error' }, { status: 500 })
    }
}
