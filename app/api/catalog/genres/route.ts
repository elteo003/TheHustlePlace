import { NextRequest } from 'next/server'
import { getGenresHandler } from '@/controllers/catalog.controller'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    return getGenresHandler(request)
}
