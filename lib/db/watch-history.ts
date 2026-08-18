import { and, desc, eq } from 'drizzle-orm'
import { WatchHistoryEntry } from '@/lib/watch-history'
import { nextWatchProgress } from '@/lib/watch-progress'
import { getDb, isDatabaseConfigured } from './index'
import { ensureProfile } from './profiles'
import { watchHistory } from './schema'

export { isDatabaseConfigured, nextWatchProgress }

export function toWatchHistoryEntry(row: typeof watchHistory.$inferSelect): WatchHistoryEntry {
    return {
        id: row.tmdbId,
        type: row.contentType,
        title: row.title,
        poster_path: row.posterPath,
        backdrop_path: row.backdropPath,
        season: row.season ?? undefined,
        episode: row.episode ?? undefined,
        progress: row.progress,
        watchedAt: row.watchedAt.getTime(),
    }
}

export async function listWatchHistory(deviceId: string): Promise<WatchHistoryEntry[]> {
    const db = getDb()
    const profile = await ensureProfile(deviceId)
    if (!db || !profile) {
        return []
    }

    const rows = await db
        .select()
        .from(watchHistory)
        .where(eq(watchHistory.profileId, profile.id))
        .orderBy(desc(watchHistory.watchedAt))
        .limit(12)

    return rows.map(toWatchHistoryEntry)
}

export interface UpsertWatchInput {
    deviceId: string
    id: number
    type: 'movie' | 'tv'
    title: string
    poster_path?: string | null
    backdrop_path?: string | null
    season?: number
    episode?: number
    position_seconds?: number
}

export async function upsertWatchHistory(input: UpsertWatchInput): Promise<number> {
    const db = getDb()
    const profile = await ensureProfile(input.deviceId)
    if (!db || !profile) {
        return nextWatchProgress()
    }

    const existing = await db
        .select({ progress: watchHistory.progress })
        .from(watchHistory)
        .where(
            and(
                eq(watchHistory.profileId, profile.id),
                eq(watchHistory.contentType, input.type),
                eq(watchHistory.tmdbId, input.id)
            )
        )
        .limit(1)

    const progress = nextWatchProgress(existing[0]?.progress)
    const now = new Date()

    await db
        .insert(watchHistory)
        .values({
            deviceId: input.deviceId,
            profileId: profile.id,
            tmdbId: input.id,
            contentType: input.type,
            title: input.title,
            posterPath: input.poster_path ?? null,
            backdropPath: input.backdrop_path ?? null,
            season: input.season ?? null,
            episode: input.episode ?? null,
            progress,
            positionSeconds: input.position_seconds ?? 0,
            watchedAt: now,
        })
        .onConflictDoUpdate({
            target: [watchHistory.profileId, watchHistory.contentType, watchHistory.tmdbId],
            set: {
                deviceId: input.deviceId,
                title: input.title,
                posterPath: input.poster_path ?? null,
                backdropPath: input.backdrop_path ?? null,
                season: input.season ?? null,
                episode: input.episode ?? null,
                progress,
                positionSeconds: input.position_seconds ?? 0,
                watchedAt: now,
            },
        })

    return progress
}

export async function deleteWatchHistory(
    deviceId: string,
    tmdbId: number,
    type: 'movie' | 'tv'
): Promise<void> {
    const db = getDb()
    const profile = await ensureProfile(deviceId)
    if (!db || !profile) {
        return
    }

    await db
        .delete(watchHistory)
        .where(
            and(
                eq(watchHistory.profileId, profile.id),
                eq(watchHistory.contentType, type),
                eq(watchHistory.tmdbId, tmdbId)
            )
        )
}
