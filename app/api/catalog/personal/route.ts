import { NextResponse } from 'next/server'
import { z } from 'zod'
import { CatalogService } from '@/services/catalog.service'
import { fetchPersonalRails, fetchServerWatchHistory } from '@/lib/server/catalog'
import { HOME_RAIL_SIZE } from '@/lib/catalog-types'
import { getOrCreateDeviceId, withDeviceCookie } from '@/lib/supabase/device'

export const dynamic = 'force-dynamic'

const catalogService = new CatalogService()

const historySchema = z.object({
    id: z.number().int().positive(),
    type: z.enum(['movie', 'tv']),
    progress: z.number().min(0).max(100),
    watchedAt: z.number().optional(),
})

const bodySchema = z.object({
    entries: z.array(historySchema).max(12),
    occupied: z
        .array(
            z.object({
                id: z.number().int().positive(),
                type: z.enum(['movie', 'tv']).optional(),
            })
        )
        .max(80)
        .optional(),
})

async function occupiedFromCatalog() {
    const [top10, comingSoon] = await Promise.all([
        catalogService.getTop10Mixed(),
        catalogService.getComingSoon(HOME_RAIL_SIZE),
    ])
    return [...top10, ...comingSoon]
}

export async function GET() {
    const { id: deviceId, isNew } = await getOrCreateDeviceId()
    try {
        const [history, occupied] = await Promise.all([fetchServerWatchHistory(), occupiedFromCatalog()])
        const rails = await fetchPersonalRails(occupied, history)
        return withDeviceCookie(NextResponse.json({ success: true, data: rails }), deviceId, isNew)
    } catch {
        return withDeviceCookie(
            NextResponse.json({ success: false, error: 'personal_rails_error' }, { status: 500 }),
            deviceId,
            isNew
        )
    }
}

export async function POST(request: Request) {
    const json = await request.json().catch(() => null)
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
        return NextResponse.json({ success: false, error: 'invalid_body' }, { status: 400 })
    }

    try {
        const occupied = parsed.data.occupied?.length
            ? parsed.data.occupied
            : await occupiedFromCatalog()
        const history = parsed.data.entries.map((entry) => ({
            id: entry.id,
            type: entry.type,
            progress: entry.progress,
            watchedAt: entry.watchedAt ?? Date.now(),
        }))
        const rails = await fetchPersonalRails(occupied, history)
        return NextResponse.json({ success: true, data: rails })
    } catch {
        return NextResponse.json({ success: false, error: 'personal_rails_error' }, { status: 500 })
    }
}
