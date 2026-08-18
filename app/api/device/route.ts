import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ensureProfile, pairDeviceToCode } from '@/lib/db/profiles'
import { isDatabaseConfigured } from '@/lib/db'
import { formatPairCode, isValidPairCode, normalizePairCode } from '@/lib/pair-code'
import { getOrCreateDeviceId, withDeviceCookie } from '@/lib/supabase/device'

export const dynamic = 'force-dynamic'

const pairSchema = z.object({
    code: z.string().min(4).max(20),
})

export async function GET() {
    const { id: deviceId, isNew } = await getOrCreateDeviceId()

    if (!isDatabaseConfigured()) {
        return withDeviceCookie(NextResponse.json({ configured: false }), deviceId, isNew)
    }

    try {
        const profile = await ensureProfile(deviceId)
        if (!profile) {
            return withDeviceCookie(
                NextResponse.json({ configured: true, error: 'db_error' }, { status: 500 }),
                deviceId,
                isNew
            )
        }

        return withDeviceCookie(
            NextResponse.json({ configured: true, code: formatPairCode(profile.pairCode) }),
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

export async function POST(request: Request) {
    const { id: deviceId, isNew } = await getOrCreateDeviceId()
    const json = await request.json().catch(() => null)
    const parsed = pairSchema.safeParse(json)

    if (!parsed.success || !isValidPairCode(parsed.data.code)) {
        return withDeviceCookie(NextResponse.json({ error: 'invalid' }, { status: 400 }), deviceId, isNew)
    }

    if (!isDatabaseConfigured()) {
        return withDeviceCookie(NextResponse.json({ configured: false }), deviceId, isNew)
    }

    const result = await pairDeviceToCode(deviceId, normalizePairCode(parsed.data.code))

    if (!result.ok) {
        const status = result.error === 'db' ? 500 : 400
        return withDeviceCookie(NextResponse.json({ error: result.error }, { status }), deviceId, isNew)
    }

    return withDeviceCookie(
        NextResponse.json({ ok: true, code: formatPairCode(result.pairCode) }),
        deviceId,
        isNew
    )
}
