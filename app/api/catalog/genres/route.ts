import { NextRequest } from 'next/server'
import { getGenresHandler } from '@/controllers/catalog.controller'

export async function GET(request: NextRequest) {
    return getGenresHandler(request)
}
