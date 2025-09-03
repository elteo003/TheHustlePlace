import { NextRequest } from 'next/server'
import { searchMoviesHandler } from '@/controllers/catalog.controller'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    return searchMoviesHandler(request)
}
