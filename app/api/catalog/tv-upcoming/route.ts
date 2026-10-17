import { NextRequest, NextResponse } from 'next/server'
import { fetchUpcomingTVCatalog } from '@/lib/tv-upcoming'
import { fetchServerWatchHistory } from '@/lib/server/catalog'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const followedQuery = searchParams.get('followed')
        
        let followed: Array<{ id: number; season?: number; episode?: number }> = []

        if (followedQuery) {
            followed = followedQuery
                .split(',')
                .map((idStr) => Number(idStr.trim()))
                .filter((id) => Number.isFinite(id) && id > 0)
                .map((id) => ({ id }))
        } else {
            // fallback to server watch history
            const serverHistory = await fetchServerWatchHistory()
            followed = serverHistory
                .filter((entry) => entry.type === 'tv')
                .map((entry) => ({ id: entry.id }))
        }

        const items = await fetchUpcomingTVCatalog(followed)
        const protectedIds = items.filter((item) => item.isFollowed).map((item) => item.id)
        return NextResponse.json({ items, protectedIds })
    } catch (error) {
        console.error('Errore /api/catalog/tv-upcoming:', error)
        return NextResponse.json({ items: [], protectedIds: [] }, { status: 500 })
    }
}
