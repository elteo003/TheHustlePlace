import { NextResponse } from 'next/server'
import { z } from 'zod'
import { isDatabaseConfigured } from '@/lib/db'
import { createHouseholdProfile } from '@/lib/db/household'
import { formatPairCode } from '@/lib/pair-code'
import { getOrCreateDeviceId, withDeviceCookie } from '@/lib/supabase/device'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
    name: z.string().min(1).max(32),
    avatar: z.number().int().min(0).max(7).optional(),
})

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

    return withDeviceCookie(
        NextResponse.json({
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
        }),
        deviceId,
        isNew
    )
}
