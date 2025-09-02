import { NextRequest, NextResponse } from 'next/server'
import { catalogController } from '@/controllers/catalog.controller'

export async function GET(request: NextRequest) {
    return await catalogController.getPopularMovies(request)
}
