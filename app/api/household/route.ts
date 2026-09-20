import { NextResponse } from 'next/server'
import { isDatabaseConfigured } from '@/lib/db'
import { ensureHousehold, presentHousehold } from '@/lib/db/household'
import { getOrCreateDeviceId, withDeviceCookie } from '@/lib/supabase/device'

export const dynamic = 'force-dynamic'

export async function GET() {
    const { id: deviceId, isNew } = await getOrCreateDeviceId()

    if (!isDatabaseConfigured()) {
        return withDeviceCookie(
            NextResponse.json({
                configured: false,
                deviceId,
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
                    deviceId,
                    householdId: null,
                    activeProfileId: 'local',
                    profiles: [{ id: 'local', name: 'Ospite', avatar: 0, pairCode: null }],
                }),
                deviceId,
                isNew
            )
        }

        return withDeviceCookie(NextResponse.json(presentHousehold(snapshot, deviceId)), deviceId, isNew)
    } catch {
        return withDeviceCookie(
            NextResponse.json({ configured: true, error: 'db_error' }, { status: 500 }),
            deviceId,
            isNew
        )
    }
}
