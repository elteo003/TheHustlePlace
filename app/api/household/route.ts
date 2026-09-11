import { NextResponse } from 'next/server'
import { isDatabaseConfigured } from '@/lib/db'
import { ensureHousehold } from '@/lib/db/household'
import { formatPairCode } from '@/lib/pair-code'
import { getOrCreateDeviceId, withDeviceCookie } from '@/lib/supabase/device'

export const dynamic = 'force-dynamic'

export async function GET() {
    const { id: deviceId, isNew } = await getOrCreateDeviceId()

    if (!isDatabaseConfigured()) {
        return withDeviceCookie(
            NextResponse.json({
                configured: false,
                householdId: null,
                activeProfileId: 'local',
                profiles: [{ id: 'local', name: 'Ospite', avatar: 0, pairCode: null }],
            }),
            deviceId,
            isNew
        )
    }

    try {
        const snapshot = await ensureHousehold(deviceId)
        if (!snapshot) {
            return withDeviceCookie(
                NextResponse.json({
                    configured: true,
                    householdId: null,
                    activeProfileId: 'local',
                    profiles: [{ id: 'local', name: 'Ospite', avatar: 0, pairCode: null }],
                }),
                deviceId,
                isNew
            )
        }

        return withDeviceCookie(
            NextResponse.json({
                configured: true,
                householdId: snapshot.householdId,
                activeProfileId: snapshot.activeProfileId,
                profiles: snapshot.profiles.map((profile) => ({
                    id: profile.id,
                    name: profile.name,
                    avatar: profile.avatar,
                    pairCode: formatPairCode(profile.pairCode),
                })),
            }),
            deviceId,
            isNew
        )
    } catch {
        return withDeviceCookie(
            NextResponse.json({ configured: true, error: 'db_error' }, { status: 500 }),
            deviceId,
            isNew
        )
    }
}
