import { NextRequest } from 'next/server'
import { searchTVShowsHandler } from '@/controllers/catalog.controller'

export async function GET(request: NextRequest) {
    return searchTVShowsHandler(request)
}
