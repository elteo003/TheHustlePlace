import { NextRequest } from 'next/server'
import { getLatestMoviesHandler } from '@/controllers/catalog.controller'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    return getLatestMoviesHandler(request)
}
