import { NextRequest, NextResponse } from 'next/server'
import { fetchUpcomingTVCatalog } from '@/lib/tv-upcoming'
import { fetchServerWatchHistory } from '@/lib/server/catalog'
import { getOrCreateDeviceId, isDeviceId } from '@/lib/supabase/device'
import { isDatabaseConfigured } from '@/lib/db'
import { listTitleFeedback } from '@/lib/db/title-feedback'

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
            // fallback to server watch history: considera serie attive o tolte ma NON finite
            const serverHistory = await fetchServerWatchHistory()
            followed = serverHistory
                .filter((entry) => entry.type === 'tv')
                .filter((entry) => {
                    if (entry.continueHidden) {
                        return (entry.progress ?? 0) < 90
                    }
                    return true
                })
                .map((entry) => ({
                    id: entry.id,
                    season: entry.season,
                    episode: entry.episode,
                }))
        }

        const rejectedIds: number[] = []
        const lovedIds: number[] = []

        if (isDatabaseConfigured()) {
            try {
                const { id: deviceId } = await getOrCreateDeviceId()
                if (isDeviceId(deviceId)) {
                    const feedbacks = await listTitleFeedback(deviceId)
                    for (const f of feedbacks) {
                        if (f.type === 'tv') {
                            if (f.liking === 'disliked' || f.liking === 'not_interested' || f.liking === 'skipped') {
                                rejectedIds.push(f.tmdbId)
                            } else if (f.liking === 'thrilled' || f.liking === 'a_lot' || f.liking === 'yes') {
                                lovedIds.push(f.tmdbId)
                            }
                        }
                    }
                }
            } catch {
                // ignore feedback fetch failure
            }
        }

        const rejectedSet = new Set(rejectedIds)
        followed = followed.filter((f) => !rejectedSet.has(f.id))

        const topGenresQuery = searchParams.get('topGenres')
        let topGenres: number[] | undefined
        if (topGenresQuery) {
            topGenres = topGenresQuery
                .split(',')
                .map((g) => Number(g.trim()))
                .filter((g) => Number.isFinite(g) && g > 0)
        }

        const items = await fetchUpcomingTVCatalog(followed, {
            topGenres,
            rejectedIds,
            lovedIds,
        })
        const protectedIds = items.filter((item) => item.isFollowed).map((item) => item.id)
        return NextResponse.json({ items, protectedIds })
    } catch (error) {
        console.error('Errore /api/catalog/tv-upcoming:', error)
        return NextResponse.json({ items: [], protectedIds: [] }, { status: 500 })
    }
}
