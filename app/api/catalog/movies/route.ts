import { NextRequest } from 'next/server'
import { getMoviesHandler } from '@/controllers/catalog.controller'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    return getMoviesHandler(request)
}
