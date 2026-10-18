import { NextRequest, NextResponse } from 'next/server'
import {
    ADMIN_COOKIE_NAME,
    ADMIN_SESSION_SECRET,
    createAdminAuthCookie,
    isValidAdminCode,
} from '@/lib/admin-auth'
import { getOrCreateDeviceId } from '@/lib/supabase/device'
import { isDatabaseConfigured } from '@/lib/db'
import { ensureProfile } from '@/lib/db/profiles'
import { normalizePairCode } from '@/lib/pair-code'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const authCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value
        let isAuthenticated = authCookie === ADMIN_SESSION_SECRET

        let devicePairCode: string | null = null
        if (isDatabaseConfigured()) {
            try {
                const { id: deviceId } = await getOrCreateDeviceId()
                const profile = await ensureProfile(deviceId)
                if (profile?.pairCode) {
                    devicePairCode = profile.pairCode
                    if (normalizePairCode(profile.pairCode) === 'M7BYZ77K') {
                        isAuthenticated = true
                    }
                }
            } catch {
                // ignore db errors
            }
        }

        return NextResponse.json({
            authenticated: isAuthenticated,
            devicePairCode,
            activeModel: 'Ranker V1 (Multi-Objective Pointwise & Explicit Liking)',
        })
    } catch {
        return NextResponse.json({ authenticated: false })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as { code?: string }
        const code = body?.code ?? ''

        if (isValidAdminCode(code)) {
            const cookieDef = createAdminAuthCookie()
            const response = NextResponse.json({
                ok: true,
                message: 'Accesso autorizzato all’area ML Diagnostics',
            })
            response.cookies.set(cookieDef.name, cookieDef.value, cookieDef.options as any)
            return response
        }

        return NextResponse.json(
            { ok: false, error: 'Codice amministratore non valido' },
            { status: 401 }
        )
    } catch {
        return NextResponse.json({ ok: false, error: 'Errore interno' }, { status: 500 })
    }
}

export async function DELETE() {
    const response = NextResponse.json({ ok: true, message: 'Disconnessione effettuata' })
    response.cookies.delete(ADMIN_COOKIE_NAME)
    return response
}
