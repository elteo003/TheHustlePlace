import { NextRequest } from 'next/server'
import { getTopRatedMoviesHandler } from '@/controllers/catalog.controller'

export async function GET(request: NextRequest) {
    return getTopRatedMoviesHandler(request)
}
