import { NextRequest } from 'next/server'
import { getPlatformTop10Handler } from '@/controllers/catalog.controller'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
    return getPlatformTop10Handler(request)
}
