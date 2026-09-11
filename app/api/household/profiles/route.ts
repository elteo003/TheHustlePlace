import { NextResponse } from 'next/server'
import { z } from 'zod'
import { isDatabaseConfigured } from '@/lib/db'
import { createHouseholdProfile, updateHouseholdProfile, type HouseholdSnapshot } from '@/lib/db/household'
import { formatPairCode } from '@/lib/pair-code'
import { getOrCreateDeviceId, withDeviceCookie } from '@/lib/supabase/device'
import { MAX_PACKED_AVATAR } from '@/tv/lib/avatars'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
    name: z.string().min(1).max(32),
    avatar: z.number().int().min(0).max(MAX_PACKED_AVATAR).optional(),
})

const updateSchema = z.object({
    profileId: z.string().uuid(),
    name: z.string().min(1).max(32),
    avatar: z.number().int().min(0).max(MAX_PACKED_AVATAR).optional(),
})

function snapshotBody(result: HouseholdSnapshot) {
    return {
        ok: true,
        configured: true,
        householdId: result.householdId,
        activeProfileId: result.activeProfileId,
        profiles: result.profiles.map((profile) => ({
            id: profile.id,
            name: profile.name,
            avatar: profile.avatar,
            pairCode: formatPairCode(profile.pairCode),
        })),
    }
}

export async function POST(request: Request) {
    const { id: deviceId, isNew } = await getOrCreateDeviceId()
    const json = await request.json().catch(() => null)
    const parsed = createSchema.safeParse(json)

    if (!parsed.success) {
        return withDeviceCookie(NextResponse.json({ error: 'invalid' }, { status: 400 }), deviceId, isNew)
    }

    if (!isDatabaseConfigured()) {
        return withDeviceCookie(NextResponse.json({ configured: false, error: 'unavailable' }, { status: 503 }), deviceId, isNew)
    }

    const result = await createHouseholdProfile(deviceId, parsed.data)
    if ('error' in result) {
        const status = result.error === 'db' ? 500 : 400
        return withDeviceCookie(NextResponse.json({ error: result.error }, { status }), deviceId, isNew)
    }

    return withDeviceCookie(NextResponse.json(snapshotBody(result)), deviceId, isNew)
}

export async function PATCH(request: Request) {
    const { id: deviceId, isNew } = await getOrCreateDeviceId()
    const json = await request.json().catch(() => null)
    const parsed = updateSchema.safeParse(json)

    if (!parsed.success) {
        return withDeviceCookie(NextResponse.json({ error: 'invalid' }, { status: 400 }), deviceId, isNew)
    }

    if (!isDatabaseConfigured()) {
        return withDeviceCookie(NextResponse.json({ configured: false, error: 'unavailable' }, { status: 503 }), deviceId, isNew)
    }

    const result = await updateHouseholdProfile(deviceId, parsed.data)
    if ('error' in result) {
        const status = result.error === 'db' ? 500 : 400
        return withDeviceCookie(NextResponse.json({ error: result.error }, { status }), deviceId, isNew)
    }

    return withDeviceCookie(NextResponse.json(snapshotBody(result)), deviceId, isNew)
}
