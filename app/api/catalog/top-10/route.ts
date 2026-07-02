import { NextRequest } from 'next/server'
import { getTop10MixedHandler } from '@/controllers/catalog.controller'

export async function GET(request: NextRequest) {
    return getTop10MixedHandler(request)
}
