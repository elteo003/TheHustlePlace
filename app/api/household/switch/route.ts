import { NextResponse } from 'next/server'
import { z } from 'zod'
import { isDatabaseConfigured } from '@/lib/db'
import { switchHouseholdProfile } from '@/lib/db/household'
import { formatPairCode } from '@/lib/pair-code'
import { getOrCreateDeviceId, withDeviceCookie } from '@/lib/supabase/device'

export const dynamic = 'force-dynamic'

const switchSchema = z.object({
    profileId: z.string().uuid(),
})

export async function POST(request: Request) {
    const { id: deviceId, isNew } = await getOrCreateDeviceId()
    const json = await request.json().catch(() => null)
    const parsed = switchSchema.safeParse(json)

    if (!parsed.success) {
        return withDeviceCookie(NextResponse.json({ error: 'invalid' }, { status: 400 }), deviceId, isNew)
    }

    if (!isDatabaseConfigured()) {
        return withDeviceCookie(NextResponse.json({ configured: false, ok: true }), deviceId, isNew)
    }

    const result = await switchHouseholdProfile(deviceId, parsed.data.profileId)
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
