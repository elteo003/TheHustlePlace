import { NextRequest } from 'next/server'
import { getPopularTVShowsHandler } from '@/controllers/catalog.controller'

export async function GET(request: NextRequest) {
    return getPopularTVShowsHandler(request)
}
