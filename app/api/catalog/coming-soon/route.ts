import { NextRequest } from 'next/server'
import { getComingSoonHandler } from '@/controllers/catalog.controller'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    return getComingSoonHandler(request)
}
