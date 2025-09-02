import { NextRequest } from 'next/server'
import { getMoviesHandler } from '@/controllers/catalog.controller'

export async function GET(request: NextRequest) {
    return getMoviesHandler(request)
}
