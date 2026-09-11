import { and, count, eq } from 'drizzle-orm'
import { generatePairCode, normalizePairCode } from '@/lib/pair-code'
import {
    canAddHouseholdProfile,
    clampAvatar,
    isPlaceholderProfile,
    PLACEHOLDER_PROFILE_NAME,
    sanitizeProfileName,
} from '@/tv/lib/household-rules'
import { getDb } from './index'
import { ensureProfile } from './profiles'
import { households, watchDevices, watchHistory, watchProfiles } from './schema'

const CODE_ATTEMPTS = 6

export interface HouseholdMember {
    id: string
    name: string
    avatar: number
    pairCode: string
}

export interface HouseholdSnapshot {
    householdId: string
    activeProfileId: string
    profiles: HouseholdMember[]
}

export interface WatchProfile {
    id: string
    pairCode: string
}

type PairError = 'invalid' | 'self' | 'db' | 'full'

async function insertProfileWithCode(
    tx: NonNullable<ReturnType<typeof getDb>>,
    values: { householdId: string; name: string; avatar: number }
) {
    for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt += 1) {
        try {
            const [profile] = await tx
                .insert(watchProfiles)
                .values({
                    pairCode: generatePairCode(),
                    householdId: values.householdId,
                    name: values.name,
                    avatar: values.avatar,
                })
                .returning()
            return profile
        } catch {
            // collisione codice
        }
    }
    return null
}

async function historyCount(profileId: string): Promise<number> {
    const db = getDb()
    if (!db) return 0
    const [row] = await db
        .select({ value: count() })
        .from(watchHistory)
        .where(eq(watchHistory.profileId, profileId))
    return Number(row?.value ?? 0)
}

async function listMembers(householdId: string): Promise<HouseholdMember[]> {
    const db = getDb()
    if (!db) return []
    const rows = await db
        .select({
            id: watchProfiles.id,
            name: watchProfiles.name,
            avatar: watchProfiles.avatar,
            pairCode: watchProfiles.pairCode,
        })
        .from(watchProfiles)
        .where(eq(watchProfiles.householdId, householdId))
    return rows.map((row) => ({
        id: row.id,
        name: row.name?.trim() || PLACEHOLDER_PROFILE_NAME,
        avatar: row.avatar ?? 0,
        pairCode: row.pairCode,
    }))
}

async function deleteHouseholdIfEmpty(householdId: string | null | undefined) {
    if (!householdId) return
    const db = getDb()
    if (!db) return
    const members = await listMembers(householdId)
    if (members.length === 0) {
        await db.delete(households).where(eq(households.id, householdId))
    }
}

async function backfillHousehold(
    deviceId: string,
    profile: { id: string; pairCode: string; householdId: string | null }
): Promise<HouseholdSnapshot | null> {
    const db = getDb()
    if (!db) return null

    let householdId = profile.householdId
    if (!householdId) {
        const [house] = await db.insert(households).values({}).returning({ id: households.id })
        householdId = house.id
        await db.update(watchProfiles).set({ householdId, name: PLACEHOLDER_PROFILE_NAME, avatar: 0 }).where(eq(watchProfiles.id, profile.id))
    }

    await db
        .update(watchDevices)
        .set({
            householdId,
            activeProfileId: profile.id,
            profileId: profile.id,
        })
        .where(eq(watchDevices.deviceId, deviceId))

    return {
        householdId,
        activeProfileId: profile.id,
        profiles: await listMembers(householdId),
    }
}

async function legacySnapshot(deviceId: string): Promise<HouseholdSnapshot | null> {
    return snapshotFromLegacyProfile(deviceId)
}

export async function ensureHousehold(deviceId: string): Promise<HouseholdSnapshot | null> {
    const db = getDb()
    if (!db) return null

    let existing: Array<{
        id: string
        pairCode: string
        householdId: string | null
        deviceHouseholdId: string | null
        activeProfileId: string | null
    }> = []

    try {
        existing = await db
            .select({
                id: watchProfiles.id,
                pairCode: watchProfiles.pairCode,
                householdId: watchProfiles.householdId,
                deviceHouseholdId: watchDevices.householdId,
                activeProfileId: watchDevices.activeProfileId,
            })
            .from(watchDevices)
            .innerJoin(watchProfiles, eq(watchDevices.profileId, watchProfiles.id))
            .where(eq(watchDevices.deviceId, deviceId))
            .limit(1)
    } catch {
        return snapshotFromLegacyProfile(deviceId)
    }

    try {
        if (existing[0]) {
            const row = existing[0]
            const activeId = row.activeProfileId ?? row.id
            if (row.householdId && row.deviceHouseholdId) {
                const profiles = await listMembers(row.householdId)
                const active = profiles.find((item) => item.id === activeId) ?? profiles[0]
                if (!active) {
                    return backfillHousehold(deviceId, row)
                }
                if (active.id !== row.id || active.id !== row.activeProfileId) {
                    await db
                        .update(watchDevices)
                        .set({ profileId: active.id, activeProfileId: active.id, householdId: row.householdId })
                        .where(eq(watchDevices.deviceId, deviceId))
                }
                return {
                    householdId: row.householdId,
                    activeProfileId: active.id,
                    profiles,
                }
            }
            return backfillHousehold(deviceId, row)
        }

        for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt += 1) {
            try {
                const created = await db.transaction(async (tx) => {
                    const [house] = await tx.insert(households).values({}).returning({ id: households.id })
                    const profile = await insertProfileWithCode(tx, {
                        householdId: house.id,
                        name: PLACEHOLDER_PROFILE_NAME,
                        avatar: 0,
                    })
                    if (!profile) {
                        throw new Error('pair_code')
                    }
                    await tx.insert(watchDevices).values({
                        deviceId,
                        profileId: profile.id,
                        householdId: house.id,
                        activeProfileId: profile.id,
                        kind: 'web',
                    })
                    return {
                        householdId: house.id,
                        activeProfileId: profile.id,
                        profiles: [
                            {
                                id: profile.id,
                                name: profile.name?.trim() || PLACEHOLDER_PROFILE_NAME,
                                avatar: profile.avatar ?? 0,
                                pairCode: profile.pairCode,
                            },
                        ],
                    }
                })
                return created
            } catch {
                // collisione o insert parallelo
            }
        }

        const raced = await db
            .select({
                id: watchProfiles.id,
                pairCode: watchProfiles.pairCode,
                householdId: watchProfiles.householdId,
            })
            .from(watchDevices)
            .innerJoin(watchProfiles, eq(watchDevices.profileId, watchProfiles.id))
            .where(eq(watchDevices.deviceId, deviceId))
            .limit(1)

        return raced[0] ? backfillHousehold(deviceId, raced[0]) : await snapshotFromLegacyProfile(deviceId)
    } catch {
        return snapshotFromLegacyProfile(deviceId)
    }
}

async function snapshotFromLegacyProfile(deviceId: string): Promise<HouseholdSnapshot | null> {
    const profile = await ensureProfile(deviceId)
    if (!profile) return null
    return {
        householdId: profile.id,
        activeProfileId: profile.id,
        profiles: [
            {
                id: profile.id,
                name: PLACEHOLDER_PROFILE_NAME,
                avatar: 0,
                pairCode: profile.pairCode,
            },
        ],
    }
}

export async function switchHouseholdProfile(
    deviceId: string,
    profileId: string
): Promise<HouseholdSnapshot | { error: 'invalid' | 'db' }> {
    const db = getDb()
    const household = await ensureHousehold(deviceId)
    if (!db || !household) return { error: 'db' }
    if (!household.profiles.some((item) => item.id === profileId)) {
        return { error: 'invalid' }
    }

    await db
        .update(watchDevices)
        .set({ profileId, activeProfileId: profileId, pairedAt: new Date() })
        .where(eq(watchDevices.deviceId, deviceId))

    return {
        ...household,
        activeProfileId: profileId,
    }
}

export async function createHouseholdProfile(
    deviceId: string,
    input: { name: string; avatar?: number }
): Promise<HouseholdSnapshot | { error: 'invalid' | 'full' | 'db' }> {
    const db = getDb()
    const household = await ensureHousehold(deviceId)
    if (!db || !household) return { error: 'db' }

    const name = sanitizeProfileName(input.name)
    if (!name) return { error: 'invalid' }
    const avatar = clampAvatar(input.avatar ?? household.profiles.length)

    const placeholder = household.profiles[0]
    if (
        household.profiles.length === 1 &&
        placeholder &&
        isPlaceholderProfile({ name: placeholder.name, historyCount: await historyCount(placeholder.id) })
    ) {
        await db
            .update(watchProfiles)
            .set({ name, avatar })
            .where(eq(watchProfiles.id, placeholder.id))
        await db
            .update(watchDevices)
            .set({ profileId: placeholder.id, activeProfileId: placeholder.id })
            .where(eq(watchDevices.deviceId, deviceId))
        return {
            householdId: household.householdId,
            activeProfileId: placeholder.id,
            profiles: [{ ...placeholder, name, avatar }],
        }
    }

    if (!canAddHouseholdProfile(household.profiles.length)) {
        return { error: 'full' }
    }

    const profile = await insertProfileWithCode(db, {
        householdId: household.householdId,
        name,
        avatar,
    })
    if (!profile) return { error: 'db' }

    await db
        .update(watchDevices)
        .set({ profileId: profile.id, activeProfileId: profile.id, pairedAt: new Date() })
        .where(eq(watchDevices.deviceId, deviceId))

    return {
        householdId: household.householdId,
        activeProfileId: profile.id,
        profiles: [
            ...household.profiles,
            { id: profile.id, name: profile.name?.trim() || PLACEHOLDER_PROFILE_NAME, avatar: profile.avatar ?? 0, pairCode: profile.pairCode },
        ],
    }
}

export async function updateHouseholdProfile(
    deviceId: string,
    input: { profileId: string; name: string; avatar?: number }
): Promise<HouseholdSnapshot | { error: 'invalid' | 'db' }> {
    const db = getDb()
    const household = await ensureHousehold(deviceId)
    if (!db || !household) return { error: 'db' }

    const name = sanitizeProfileName(input.name)
    if (!name) return { error: 'invalid' }

    const existing = household.profiles.find((profile) => profile.id === input.profileId)
    if (!existing) return { error: 'invalid' }

    const avatar = input.avatar === undefined ? existing.avatar : clampAvatar(input.avatar)

    await db.update(watchProfiles).set({ name, avatar }).where(eq(watchProfiles.id, existing.id))

    return {
        householdId: household.householdId,
        activeProfileId: household.activeProfileId,
        profiles: household.profiles.map((profile) =>
            profile.id === existing.id ? { ...profile, name, avatar } : profile
        ),
    }
}

export async function adoptProfileByCode(
    deviceId: string,
    pairCode: string
): Promise<{ ok: true; snapshot: HouseholdSnapshot } | { ok: false; error: PairError }> {
    const db = getDb()
    const household = await ensureHousehold(deviceId)
    if (!db || !household) return { ok: false, error: 'db' }

    const code = normalizePairCode(pairCode)
    const [target] = await db.select().from(watchProfiles).where(eq(watchProfiles.pairCode, code)).limit(1)
    if (!target) return { ok: false, error: 'invalid' }

    if (household.profiles.some((item) => item.id === target.id)) {
        const switched = await switchHouseholdProfile(deviceId, target.id)
        if ('error' in switched) return { ok: false, error: switched.error }
        return { ok: true, snapshot: switched }
    }

    const placeholder = household.profiles[0]
    const canReplacePlaceholder =
        household.profiles.length === 1 &&
        placeholder &&
        isPlaceholderProfile({ name: placeholder.name, historyCount: await historyCount(placeholder.id) })

    if (!canReplacePlaceholder && !canAddHouseholdProfile(household.profiles.length)) {
        return { ok: false, error: 'full' }
    }

    try {
        await db.transaction(async (tx) => {
            const oldHouseholdId = target.householdId
            await tx
                .update(watchProfiles)
                .set({ householdId: household.householdId })
                .where(eq(watchProfiles.id, target.id))
            await tx
                .update(watchDevices)
                .set({
                    householdId: household.householdId,
                    activeProfileId: target.id,
                    profileId: target.id,
                    pairedAt: new Date(),
                })
                .where(eq(watchDevices.profileId, target.id))
            await tx
                .update(watchDevices)
                .set({
                    householdId: household.householdId,
                    activeProfileId: target.id,
                    profileId: target.id,
                    pairedAt: new Date(),
                })
                .where(eq(watchDevices.deviceId, deviceId))

            if (canReplacePlaceholder && placeholder) {
                await tx.delete(watchHistory).where(eq(watchHistory.profileId, placeholder.id))
                await tx.delete(watchDevices).where(and(eq(watchDevices.profileId, placeholder.id), eq(watchDevices.deviceId, deviceId)))
                await tx
                    .insert(watchDevices)
                    .values({
                        deviceId,
                        profileId: target.id,
                        householdId: household.householdId,
                        activeProfileId: target.id,
                        pairedAt: new Date(),
                    })
                    .onConflictDoUpdate({
                        target: watchDevices.deviceId,
                        set: {
                            profileId: target.id,
                            householdId: household.householdId,
                            activeProfileId: target.id,
                            pairedAt: new Date(),
                        },
                    })
                await tx.delete(watchProfiles).where(eq(watchProfiles.id, placeholder.id))
            }

            if (oldHouseholdId && oldHouseholdId !== household.householdId) {
                const leftover = await tx
                    .select({ id: watchProfiles.id })
                    .from(watchProfiles)
                    .where(eq(watchProfiles.householdId, oldHouseholdId))
                if (leftover.length === 0) {
                    await tx.delete(households).where(eq(households.id, oldHouseholdId))
                }
            }
        })
    } catch {
        return { ok: false, error: 'db' }
    }

    const snapshot = await ensureHousehold(deviceId)
    if (!snapshot) return { ok: false, error: 'db' }
    return { ok: true, snapshot }
}

export async function pairDeviceToCode(
    deviceId: string,
    pairCode: string
): Promise<{ ok: true; pairCode: string } | { ok: false; error: 'invalid' | 'self' | 'db' }> {
    const db = getDb()
    if (!db) return { ok: false, error: 'db' }

    const current = await ensureProfile(deviceId)
    if (!current) return { ok: false, error: 'db' }

    const [target] = await db
        .select()
        .from(watchProfiles)
        .where(eq(watchProfiles.pairCode, normalizePairCode(pairCode)))
        .limit(1)

    if (!target) return { ok: false, error: 'invalid' }
    if (target.id === current.id) return { ok: false, error: 'self' }

    const [currentRow] = await db.select().from(watchProfiles).where(eq(watchProfiles.id, current.id)).limit(1)

    try {
        await db.transaction(async (tx) => {
            const sourceRows = await tx.select().from(watchHistory).where(eq(watchHistory.profileId, current.id))

            for (const row of sourceRows) {
                const [existing] = await tx
                    .select({ id: watchHistory.id, watchedAt: watchHistory.watchedAt })
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

            const targetHouseholdId = target.householdId ?? currentRow?.householdId ?? null
            await tx.delete(watchHistory).where(eq(watchHistory.profileId, current.id))
            await tx
                .update(watchDevices)
                .set({
                    profileId: target.id,
                    activeProfileId: target.id,
                    householdId: targetHouseholdId,
                    pairedAt: new Date(),
                })
                .where(eq(watchDevices.profileId, current.id))
            await tx.delete(watchProfiles).where(eq(watchProfiles.id, current.id))
        })
    } catch {
        return { ok: false, error: 'db' }
    }

    await deleteHouseholdIfEmpty(currentRow?.householdId)
    return { ok: true, pairCode: target.pairCode }
}
