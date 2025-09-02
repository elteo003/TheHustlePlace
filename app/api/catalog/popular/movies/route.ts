import { NextRequest } from 'next/server'
import { getPopularMoviesHandler } from '@/controllers/catalog.controller'

export async function GET(request: NextRequest) {
    return getPopularMoviesHandler(request)
}
