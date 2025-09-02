import { NextRequest } from 'next/server'
import { getTVShowsHandler } from '@/controllers/catalog.controller'

export async function GET(request: NextRequest) {
    return getTVShowsHandler(request)
}
