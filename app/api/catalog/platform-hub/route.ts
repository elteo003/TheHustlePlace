import { NextRequest } from 'next/server'
import { getPlatformHubHandler } from '@/controllers/catalog.controller'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
    return getPlatformHubHandler(request)
}
