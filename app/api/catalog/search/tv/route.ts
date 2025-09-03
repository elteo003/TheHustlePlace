import { NextRequest } from 'next/server'
import { searchTVShowsHandler } from '@/controllers/catalog.controller'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    return searchTVShowsHandler(request)
}
