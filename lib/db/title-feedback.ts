import { and, eq } from 'drizzle-orm'
import { getDb } from './index'
import { ensureProfile } from './profiles'
import { rankerWeights, tasteSnapshot, titleFeedback } from './schema'
import {
    RANKER_WEIGHTS_V1,
    type FeedbackMoment,
    type Liking,
    type RankerWeights,
    type TitleFeedback,
    type WouldContinue,
} from '@/lib/taste-ranker'

function toFeedback(row: typeof titleFeedback.$inferSelect): TitleFeedback {
    return {
        tmdbId: row.tmdbId,
        type: row.contentType,
        season: row.season,
        moment: row.moment,
        liking: row.liking,
        wouldContinue: row.wouldContinue ?? null,
        updatedAt: row.updatedAt.getTime(),
    }
}

export async function listTitleFeedback(deviceId: string): Promise<TitleFeedback[]> {
    const db = getDb()
    const profile = await ensureProfile(deviceId)
    if (!db || !profile) return []

    const rows = await db.select().from(titleFeedback).where(eq(titleFeedback.profileId, profile.id))
    return rows.map(toFeedback)
}

export async function findTitleFeedback(
    deviceId: string,
    tmdbId: number,
    type: 'movie' | 'tv',
    season: number,
    moment: FeedbackMoment
): Promise<TitleFeedback | null> {
    const db = getDb()
    const profile = await ensureProfile(deviceId)
    if (!db || !profile) return null

    const rows = await db
        .select()
        .from(titleFeedback)
        .where(
            and(
                eq(titleFeedback.profileId, profile.id),
                eq(titleFeedback.contentType, type),
                eq(titleFeedback.tmdbId, tmdbId),
                eq(titleFeedback.season, season),
                eq(titleFeedback.moment, moment)
            )
        )
        .limit(1)

    return rows[0] ? toFeedback(rows[0]) : null
}

export async function upsertTitleFeedback(input: {
    deviceId: string
    tmdbId: number
    type: 'movie' | 'tv'
    season?: number
    moment: FeedbackMoment
    liking: Liking
    wouldContinue?: WouldContinue | null
}): Promise<TitleFeedback | null> {
    const db = getDb()
    const profile = await ensureProfile(input.deviceId)
    if (!db || !profile) return null

    const season = input.type === 'tv' ? input.season || 0 : 0
    const now = new Date()
    const values = {
        profileId: profile.id,
        tmdbId: input.tmdbId,
        contentType: input.type,
        season,
        moment: input.moment,
        liking: input.liking,
        wouldContinue: input.wouldContinue ?? null,
        createdAt: now,
        updatedAt: now,
    }

    const rows = await db
        .insert(titleFeedback)
        .values(values)
        .onConflictDoUpdate({
            target: [
                titleFeedback.profileId,
                titleFeedback.contentType,
                titleFeedback.tmdbId,
                titleFeedback.season,
                titleFeedback.moment,
            ],
            set: {
                liking: input.liking,
                wouldContinue: input.wouldContinue ?? null,
                updatedAt: now,
            },
        })
        .returning()

    return rows[0] ? toFeedback(rows[0]) : null
}

export async function saveTasteSnapshot(deviceId: string, payload: Record<string, unknown>): Promise<void> {
    const db = getDb()
    const profile = await ensureProfile(deviceId)
    if (!db || !profile) return

    const now = new Date()
    try {
        await db
            .insert(tasteSnapshot)
            .values({ profileId: profile.id, payload, updatedAt: now })
            .onConflictDoUpdate({
                target: tasteSnapshot.profileId,
                set: { payload, updatedAt: now },
            })
    } catch {
        return
    }
}

export async function loadRankerWeights(): Promise<RankerWeights> {
    const db = getDb()
    if (!db) return RANKER_WEIGHTS_V1

    try {
        const rows = await db.select().from(rankerWeights).where(eq(rankerWeights.version, 'v1')).limit(1)
        const stored = rows[0]?.weights
        if (!stored || typeof stored !== 'object') return RANKER_WEIGHTS_V1
        return { ...RANKER_WEIGHTS_V1, ...stored, version: 'v1' }
    } catch {
        return RANKER_WEIGHTS_V1
    }
}
