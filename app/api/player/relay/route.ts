import { NextRequest, NextResponse } from 'next/server'
import { saveHomeRelayUrl } from '@/lib/db/vixsrc-relay'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
    const token = request.headers.get('x-relay-token') || ''
    const body = (await request.json().catch(() => null)) as { url?: unknown } | null
    const url = typeof body?.url === 'string' ? body.url : ''
    if (!token || !url) {
        return NextResponse.json({ success: false, error: 'Dati relay mancanti' }, { status: 400 })
    }
    const saved = await saveHomeRelayUrl(url, token)
    if (!saved) {
        return NextResponse.json({ success: false, error: 'Relay non accettato' }, { status: 403 })
    }
    return NextResponse.json({ success: true })
}
