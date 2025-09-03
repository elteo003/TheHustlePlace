import { NextRequest } from 'next/server'
import { getLatestTVShowsHandler } from '@/controllers/catalog.controller'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    return getLatestTVShowsHandler(request)
}
