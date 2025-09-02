import { NextRequest } from 'next/server'
import { getLatestMoviesHandler } from '@/controllers/catalog.controller'

export async function GET(request: NextRequest) {
    return getLatestMoviesHandler(request)
}
