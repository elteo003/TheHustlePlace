import { NextResponse } from 'next/server'
import { z } from 'zod'
import { adoptProfileByCode, ensureHousehold, pairDeviceToCode, presentHousehold } from '@/lib/db/household'
import { isDatabaseConfigured } from '@/lib/db'
import { formatPairCode, isValidPairCode, normalizePairCode } from '@/lib/pair-code'
import { getOrCreateDeviceId, withDeviceCookie } from '@/lib/supabase/device'

export const dynamic = 'force-dynamic'

const pairSchema = z.object({
    code: z.string().min(4).max(20),
    mode: z.enum(['merge', 'adopt']).optional(),
})

export async function GET() {
    const { id: deviceId, isNew } = await getOrCreateDeviceId()

    if (!isDatabaseConfigured()) {
        return withDeviceCookie(NextResponse.json({ configured: false }), deviceId, isNew)
    }

    try {
        const snapshot = await ensureHousehold(deviceId)
        if (!snapshot) {
            return withDeviceCookie(
                NextResponse.json({ configured: true, error: 'db_error' }, { status: 500 }),
                deviceId,
                isNew
            )
        }

        const presented = presentHousehold(snapshot, deviceId)
        const active = presented.profiles.find((item) => item.id === snapshot.activeProfileId) ?? presented.profiles[0]
        return withDeviceCookie(
            NextResponse.json({
                ...presented,
                code: active?.pairCode,
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

    const code = normalizePairCode(parsed.data.code)
    const mode = parsed.data.mode ?? 'adopt'

    if (mode === 'adopt') {
        const adopted = await adoptProfileByCode(deviceId, code)
        if (!adopted.ok) {
            const status = adopted.error === 'db' ? 500 : 400
            return withDeviceCookie(NextResponse.json({ error: adopted.error }, { status }), deviceId, isNew)
        }
        const presented = presentHousehold(adopted.snapshot, deviceId)
        const active = presented.profiles.find((item) => item.id === presented.activeProfileId)
        return withDeviceCookie(
            NextResponse.json({
                ok: true,
                mode: 'adopt',
                ...presented,
                code: active?.pairCode ?? presented.profiles[0]?.pairCode,
            }),
            deviceId,
            isNew
        )
    }

    const result = await pairDeviceToCode(deviceId, code)

    if (!result.ok) {
        const status = result.error === 'db' ? 500 : 400
        return withDeviceCookie(NextResponse.json({ error: result.error }, { status }), deviceId, isNew)
    }

    const snapshot = await ensureHousehold(deviceId)
    const presented = snapshot ? presentHousehold(snapshot, deviceId) : null

    return withDeviceCookie(
        NextResponse.json({
            ok: true,
            mode: 'merge',
            ...presented,
            code: formatPairCode(result.pairCode),
        }),
        deviceId,
        isNew
    )
}
