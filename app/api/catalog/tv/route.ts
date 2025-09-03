import { NextRequest } from 'next/server'
import { getTVShowsHandler } from '@/controllers/catalog.controller'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    return getTVShowsHandler(request)
}
