import { NextRequest, NextResponse } from 'next/server'
import { checkAndUpdateVercelUsage, getActiveDomain } from '@/lib/services/vercel-usage'

function isAuthorized(req: NextRequest): boolean {
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) return true // In development or if not configured yet, allow manual trigger

    const authHeader = req.headers.get('authorization')
    if (authHeader === `Bearer ${cronSecret}`) return true

    const querySecret = req.nextUrl.searchParams.get('secret')
    if (querySecret === cronSecret) return true

    return false
}

export async function GET(req: NextRequest) {
    if (!isAuthorized(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const result = await checkAndUpdateVercelUsage()
        return NextResponse.json(result)
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        const currentActive = await getActiveDomain()
        return NextResponse.json(
            {
                success: false,
                activeDomain: currentActive,
                error: message,
            },
            { status: 500 }
        )
    }
}

export async function POST(req: NextRequest) {
    return GET(req)
}
