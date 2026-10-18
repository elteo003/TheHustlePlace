import { normalizePairCode } from '@/lib/pair-code'

export const MASTER_ADMIN_CODE_RAW = 'M7BYZ77K'
export const MASTER_ADMIN_CODE_FORMATTED = 'M7BY - Z77K'
export const ADMIN_COOKIE_NAME = 'thp_admin_auth'
export const ADMIN_SESSION_SECRET = 'thp_admin_active_session_token_v1'

export function isValidAdminCode(input: string | null | undefined): boolean {
    if (!input) return false
    const normalizedInput = normalizePairCode(input)
    const expected = normalizePairCode(process.env.ADMIN_PASSCODE || MASTER_ADMIN_CODE_RAW)
    return normalizedInput === expected
}

export function isDeviceAdminCode(devicePairCode: string | null | undefined): boolean {
    if (!devicePairCode) return false
    return normalizePairCode(devicePairCode) === MASTER_ADMIN_CODE_RAW
}

export function createAdminAuthCookie(): { name: string; value: string; options: object } {
    return {
        name: ADMIN_COOKIE_NAME,
        value: ADMIN_SESSION_SECRET,
        options: {
            httpOnly: false, // accessible to client for reactive UI checks
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax' as const,
            path: '/',
            maxAge: 60 * 60 * 24 * 30, // 30 days
        },
    }
}
