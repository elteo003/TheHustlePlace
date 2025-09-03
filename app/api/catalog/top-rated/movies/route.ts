import { NextRequest } from 'next/server'
import { getTopRatedMoviesHandler } from '@/controllers/catalog.controller'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    return getTopRatedMoviesHandler(request)
}
