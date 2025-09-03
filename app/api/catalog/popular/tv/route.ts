import { NextRequest } from 'next/server'
import { getPopularTVShowsHandler } from '@/controllers/catalog.controller'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    return getPopularTVShowsHandler(request)
}
