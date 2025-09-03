import { NextRequest } from 'next/server'
import { getTopRatedTVShowsHandler } from '@/controllers/catalog.controller'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    return getTopRatedTVShowsHandler(request)
}
