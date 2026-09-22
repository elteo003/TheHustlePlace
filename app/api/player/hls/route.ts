import { NextRequest, NextResponse } from 'next/server'
import { classifyHlsRef, isAllowedHlsUrl, isHlsManifestBuffer, rewriteM3u8 } from '@/lib/vixsrc-hls'
import { vixsrcRequestHeaders } from '@/services/vixsrc-hls.service'

export const preferredRegion = ['fra1', 'cdg1']
export const maxDuration = 60

function playlistResponse(body: string, sourceUrl: string) {
    return new NextResponse(rewriteM3u8(body, sourceUrl, '/api/player/hls?u='), {
        status: 200,
        headers: {
            'Content-Type': 'application/vnd.apple.mpegurl',
            'Cache-Control': 'private, no-store',
        },
    })
}

export async function GET(request: NextRequest) {
    const target = request.nextUrl.searchParams.get('u')
    if (!target || !isAllowedHlsUrl(target)) {
        return NextResponse.json({ error: 'URL non consentito' }, { status: 400 })
    }

    if (classifyHlsRef(target) === 'cdn') {
        return NextResponse.redirect(target, 302)
    }

    const upstream = await fetch(target, {
        headers: vixsrcRequestHeaders(),
        cache: 'no-store',
        redirect: 'follow',
    })

    if (!isAllowedHlsUrl(upstream.url)) {
        return NextResponse.json({ error: 'Redirect non consentito' }, { status: 400 })
    }

    const buffer = Buffer.from(await upstream.arrayBuffer())
    if (isHlsManifestBuffer(buffer)) {
        return playlistResponse(buffer.toString('utf8'), upstream.url)
    }

    if (classifyHlsRef(upstream.url) === 'cdn') {
        return NextResponse.redirect(upstream.url, 302)
    }

    return new NextResponse(buffer, {
        status: upstream.status,
        headers: {
            'Content-Type': upstream.headers.get('content-type') || 'application/octet-stream',
            'Cache-Control': 'private, max-age=60',
        },
    })
}
