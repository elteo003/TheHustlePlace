import { NextResponse } from 'next/server'
import { z } from 'zod'
import { isDatabaseConfigured } from '@/lib/db'
import { findTitleFeedback, saveTasteSnapshot, upsertTitleFeedback } from '@/lib/db/title-feedback'
import { RANKER_VERSION } from '@/lib/taste-ranker'
import { getOrCreateDeviceId, withDeviceCookie } from '@/lib/supabase/device'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
    tmdbId: z.number().int().positive(),
    type: z.enum(['movie', 'tv']),
    season: z.number().int().min(0).optional(),
    moment: z.enum(['mid_season', 'end_season', 'end_movie', 'dismiss']),
    liking: z.enum(['yes', 'a_lot', 'thrilled', 'skipped', 'disliked', 'not_interested']),
    wouldContinue: z.enum(['yes', 'no']).nullable().optional(),
})

export async function GET(request: Request) {
    const { id: deviceId, isNew } = await getOrCreateDeviceId()
    const url = new URL(request.url)
    const tmdbId = Number(url.searchParams.get('tmdbId'))
    const type = url.searchParams.get('type')
    const season = Number(url.searchParams.get('season') || '0')
    const moment = url.searchParams.get('moment')

    if (!tmdbId || (type !== 'movie' && type !== 'tv') || !moment) {
        return withDeviceCookie(NextResponse.json({ error: 'invalid_query' }, { status: 400 }), deviceId, isNew)
    }
    if (moment !== 'mid_season' && moment !== 'end_season' && moment !== 'end_movie' && moment !== 'dismiss') {
        return withDeviceCookie(NextResponse.json({ error: 'invalid_query' }, { status: 400 }), deviceId, isNew)
    }

    if (!isDatabaseConfigured()) {
        return withDeviceCookie(NextResponse.json({ configured: false, answered: false }), deviceId, isNew)
    }

    try {
        const existing = await findTitleFeedback(deviceId, tmdbId, type, type === 'tv' ? season : 0, moment)
        return withDeviceCookie(
            NextResponse.json({ configured: true, answered: Boolean(existing), feedback: existing }),
            deviceId,
            isNew
        )
    } catch {
        return withDeviceCookie(
            NextResponse.json({ configured: true, error: 'db_error', answered: false }, { status: 500 }),
            deviceId,
            isNew
        )
    }
}

export async function POST(request: Request) {
    const { id: deviceId, isNew } = await getOrCreateDeviceId()
    const json = await request.json().catch(() => null)
    const parsed = bodySchema.safeParse(json)

    if (!parsed.success) {
        return withDeviceCookie(NextResponse.json({ error: 'invalid_body' }, { status: 400 }), deviceId, isNew)
    }

    if (!isDatabaseConfigured()) {
        return withDeviceCookie(NextResponse.json({ configured: false, ok: true }), deviceId, isNew)
    }

    try {
        const feedback = await upsertTitleFeedback({
            deviceId,
            tmdbId: parsed.data.tmdbId,
            type: parsed.data.type,
            season: parsed.data.season,
            moment: parsed.data.moment,
            liking: parsed.data.liking,
            wouldContinue: parsed.data.wouldContinue ?? null,
        })
        void saveTasteSnapshot(deviceId, {
            version: RANKER_VERSION,
            tmdbId: parsed.data.tmdbId,
            moment: parsed.data.moment,
            liking: parsed.data.liking,
            wouldContinue: parsed.data.wouldContinue ?? null,
            updatedAt: Date.now(),
        })
        return withDeviceCookie(NextResponse.json({ configured: true, ok: true, feedback }), deviceId, isNew)
    } catch {
        return withDeviceCookie(
            NextResponse.json({ configured: true, error: 'db_error' }, { status: 500 }),
            deviceId,
            isNew
        )
    }
}
