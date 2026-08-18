import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const DEVICE_COOKIE = 'thp_device_id'
const ONE_YEAR = 60 * 60 * 24 * 365

export async function getOrCreateDeviceId(): Promise<{ id: string; isNew: boolean }> {
    const store = await cookies()
    const existing = store.get(DEVICE_COOKIE)?.value
    if (existing) {
        return { id: existing, isNew: false }
    }

    const id = crypto.randomUUID()
    return { id, isNew: true }
}

export function withDeviceCookie(response: NextResponse, deviceId: string, isNew: boolean): NextResponse {
    if (isNew) {
        response.cookies.set(DEVICE_COOKIE, deviceId, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: ONE_YEAR,
            path: '/',
        })
    }
    return response
}
