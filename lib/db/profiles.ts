import { and, eq } from 'drizzle-orm'
import { generatePairCode } from '@/lib/pair-code'
import { getDb } from './index'
import { watchDevices, watchHistory, watchProfiles } from './schema'

const CODE_ATTEMPTS = 6

export interface WatchProfile {
    id: string
    pairCode: string
}

export async function ensureProfile(deviceId: string): Promise<WatchProfile | null> {
    const db = getDb()
    if (!db) {
        return null
    }

    const existing = await db
        .select({
            id: watchProfiles.id,
            pairCode: watchProfiles.pairCode,
        })
        .from(watchDevices)
        .innerJoin(watchProfiles, eq(watchDevices.profileId, watchProfiles.id))
        .where(eq(watchDevices.deviceId, deviceId))
        .limit(1)

    if (existing[0]) {
        return existing[0]
    }

    for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt += 1) {
        const pairCode = generatePairCode()
        try {
            const created = await db.transaction(async (tx) => {
                const [profile] = await tx
                    .insert(watchProfiles)
                    .values({ pairCode })
                    .returning({ id: watchProfiles.id, pairCode: watchProfiles.pairCode })

                await tx.insert(watchDevices).values({
                    deviceId,
                    profileId: profile.id,
                })

                return profile
            })
            return created
        } catch {
            // collisione sul codice o device già inserito in parallelo
        }
    }

    const raced = await db
        .select({
            id: watchProfiles.id,
            pairCode: watchProfiles.pairCode,
        })
        .from(watchDevices)
        .innerJoin(watchProfiles, eq(watchDevices.profileId, watchProfiles.id))
        .where(eq(watchDevices.deviceId, deviceId))
        .limit(1)

    return raced[0] ?? null
}

export async function pairDeviceToCode(
    deviceId: string,
    pairCode: string
): Promise<{ ok: true; pairCode: string } | { ok: false; error: 'invalid' | 'self' | 'db' }> {
    const db = getDb()
    if (!db) {
        return { ok: false, error: 'db' }
    }

    const current = await ensureProfile(deviceId)
    if (!current) {
        return { ok: false, error: 'db' }
    }

    const [target] = await db
        .select()
        .from(watchProfiles)
        .where(eq(watchProfiles.pairCode, pairCode))
        .limit(1)

    if (!target) {
        return { ok: false, error: 'invalid' }
    }

    if (target.id === current.id) {
        return { ok: false, error: 'self' }
    }

    try {
        await db.transaction(async (tx) => {
            const sourceRows = await tx
                .select()
                .from(watchHistory)
                .where(eq(watchHistory.profileId, current.id))

            for (const row of sourceRows) {
                const [existing] = await tx
                    .select({
                        id: watchHistory.id,
                        watchedAt: watchHistory.watchedAt,
                    })
                    .from(watchHistory)
                    .where(
                        and(
                            eq(watchHistory.profileId, target.id),
                            eq(watchHistory.contentType, row.contentType),
                            eq(watchHistory.tmdbId, row.tmdbId)
                        )
                    )
                    .limit(1)

                if (!existing) {
                    await tx.insert(watchHistory).values({
                        deviceId,
                        profileId: target.id,
                        tmdbId: row.tmdbId,
                        contentType: row.contentType,
                        title: row.title,
                        posterPath: row.posterPath,
                        backdropPath: row.backdropPath,
                        season: row.season,
                        episode: row.episode,
                        progress: row.progress,
                        positionSeconds: row.positionSeconds,
                        watchedAt: row.watchedAt,
                    })
                    continue
                }

                if (row.watchedAt > existing.watchedAt) {
                    await tx
                        .update(watchHistory)
                        .set({
                            deviceId,
                            title: row.title,
                            posterPath: row.posterPath,
                            backdropPath: row.backdropPath,
                            season: row.season,
                            episode: row.episode,
                            progress: row.progress,
                            positionSeconds: row.positionSeconds,
                            watchedAt: row.watchedAt,
                        })
                        .where(eq(watchHistory.id, existing.id))
                }
            }

            await tx.delete(watchHistory).where(eq(watchHistory.profileId, current.id))
            await tx
                .update(watchDevices)
                .set({ profileId: target.id, pairedAt: new Date() })
                .where(eq(watchDevices.profileId, current.id))
            await tx.delete(watchProfiles).where(eq(watchProfiles.id, current.id))
        })
    } catch {
        return { ok: false, error: 'db' }
    }

    return { ok: true, pairCode: target.pairCode }
}
