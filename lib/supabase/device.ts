import { cookies, headers } from 'next/headers'
import { NextResponse } from 'next/server'

export const DEVICE_COOKIE = 'thp_device_id'
export const DEVICE_HEADER = 'x-thp-device-id'
const ONE_YEAR = 60 * 60 * 24 * 365
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isDeviceId(value: string | undefined | null): value is string {
    return Boolean(value && UUID_RE.test(value))
}

export async function getOrCreateDeviceId(): Promise<{ id: string; isNew: boolean }> {
    const store = await cookies()
    const cookieId = store.get(DEVICE_COOKIE)?.value
    if (isDeviceId(cookieId)) {
        return { id: cookieId, isNew: false }
    }

    const headerId = (await headers()).get(DEVICE_HEADER)
    if (isDeviceId(headerId)) {
        return { id: headerId, isNew: true }
    }

    return { id: crypto.randomUUID(), isNew: true }
}

export function withDeviceCookie(response: NextResponse, deviceId: string, _isNew?: boolean): NextResponse {
    response.cookies.set(DEVICE_COOKIE, deviceId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: ONE_YEAR,
        path: '/',
    })
    return response
}
