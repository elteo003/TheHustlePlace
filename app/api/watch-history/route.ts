import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
    deleteWatchHistory,
    isDatabaseConfigured,
    listWatchHistory,
    upsertWatchHistory,
} from '@/lib/db/watch-history'
import { getOrCreateDeviceId, withDeviceCookie } from '@/lib/supabase/device'

export const dynamic = 'force-dynamic'

const trackSchema = z.object({
    id: z.number().int().positive(),
    type: z.enum(['movie', 'tv']),
    title: z.string().min(1).max(300),
    poster_path: z.string().nullable().optional(),
    backdrop_path: z.string().nullable().optional(),
    season: z.number().int().positive().optional(),
    episode: z.number().int().positive().optional(),
    position_seconds: z.number().int().min(0).optional(),
})

export async function GET() {
    const { id: deviceId, isNew } = await getOrCreateDeviceId()

    if (!isDatabaseConfigured()) {
        return withDeviceCookie(NextResponse.json({ configured: false, entries: [] }), deviceId, isNew)
    }

    try {
        const entries = await listWatchHistory(deviceId)
        return withDeviceCookie(NextResponse.json({ configured: true, entries }), deviceId, isNew)
    } catch {
        return withDeviceCookie(
            NextResponse.json({ configured: true, error: 'db_error', entries: [] }, { status: 500 }),
            deviceId,
            isNew
        )
    }
}

export async function POST(request: Request) {
    const { id: deviceId, isNew } = await getOrCreateDeviceId()
    const json = await request.json().catch(() => null)
    const parsed = trackSchema.safeParse(json)

    if (!parsed.success) {
        return withDeviceCookie(NextResponse.json({ error: 'invalid_body' }, { status: 400 }), deviceId, isNew)
    }

    if (!isDatabaseConfigured()) {
        return withDeviceCookie(NextResponse.json({ configured: false, ok: true }), deviceId, isNew)
    }

    try {
        const progress = await upsertWatchHistory({
            deviceId,
            ...parsed.data,
        })
        return withDeviceCookie(NextResponse.json({ configured: true, ok: true, progress }), deviceId, isNew)
    } catch {
        return withDeviceCookie(
            NextResponse.json({ configured: true, error: 'db_error' }, { status: 500 }),
            deviceId,
            isNew
        )
    }
}

export async function DELETE(request: Request) {
    const { id: deviceId, isNew } = await getOrCreateDeviceId()
    const { searchParams } = new URL(request.url)
    const tmdbId = Number(searchParams.get('id'))
    const type = searchParams.get('type')

    if (!tmdbId || (type !== 'movie' && type !== 'tv')) {
        return withDeviceCookie(NextResponse.json({ error: 'invalid_query' }, { status: 400 }), deviceId, isNew)
    }

    if (!isDatabaseConfigured()) {
        return withDeviceCookie(NextResponse.json({ configured: false, ok: true }), deviceId, isNew)
    }

    try {
        await deleteWatchHistory(deviceId, tmdbId, type)
        return withDeviceCookie(NextResponse.json({ configured: true, ok: true }), deviceId, isNew)
    } catch {
        return withDeviceCookie(
            NextResponse.json({ configured: true, error: 'db_error' }, { status: 500 }),
            deviceId,
            isNew
        )
    }
}
