import { NextRequest } from 'next/server'
import { getLatestTVShowsHandler } from '@/controllers/catalog.controller'

export async function GET(request: NextRequest) {
    return getLatestTVShowsHandler(request)
}
