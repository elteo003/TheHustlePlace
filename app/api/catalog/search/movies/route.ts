import { NextRequest } from 'next/server'
import { searchMoviesHandler } from '@/controllers/catalog.controller'

export async function GET(request: NextRequest) {
    return searchMoviesHandler(request)
}
