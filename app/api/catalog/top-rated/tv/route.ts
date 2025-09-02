import { NextRequest } from 'next/server'
import { getTopRatedTVShowsHandler } from '@/controllers/catalog.controller'

export async function GET(request: NextRequest) {
    return getTopRatedTVShowsHandler(request)
}
