import { NextRequest } from 'next/server'
import { getComingToCinemaHandler } from '@/controllers/catalog.controller'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    return getComingToCinemaHandler(request)
}
