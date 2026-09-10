import { NextRequest, NextResponse } from 'next/server'
import { isAllowedHlsUrl, isM3u8Playlist, rewriteM3u8 } from '@/lib/vixsrc-hls'
import { vixsrcRequestHeaders } from '@/services/vixsrc-hls.service'

const PASS_HEADERS = ['content-type', 'content-length', 'content-range', 'accept-ranges'] as const

function playlistResponse(body: string, sourceUrl: string) {
    return new NextResponse(rewriteM3u8(body, sourceUrl, '/api/player/hls?u='), {
        status: 200,
        headers: {
            'Content-Type': 'application/vnd.apple.mpegurl',
            'Cache-Control': 'private, no-store',
        },
    })
}

function passthroughHeaders(upstream: Response, fallbackType: string) {
    const headers = new Headers()
    for (const name of PASS_HEADERS) {
        const value = upstream.headers.get(name)
        if (value) headers.set(name, value)
    }
    if (!headers.has('content-type')) {
        headers.set('content-type', fallbackType)
    }
    headers.set('Cache-Control', 'private, max-age=60')
    return headers
}

export async function GET(request: NextRequest) {
    const target = request.nextUrl.searchParams.get('u')
    if (!target || !isAllowedHlsUrl(target)) {
        return NextResponse.json({ error: 'URL non consentito' }, { status: 400 })
    }

    const range = request.headers.get('range')
    const upstream = await fetch(target, {
        headers: vixsrcRequestHeaders(range ? { Range: range } : undefined),
        cache: 'no-store',
        redirect: 'follow',
    })

    if (!isAllowedHlsUrl(upstream.url)) {
        return NextResponse.json({ error: 'Redirect non consentito' }, { status: 400 })
    }

    const contentType = upstream.headers.get('content-type') || ''
    const isTextManifest =
        contentType.includes('mpegurl') ||
        contentType.includes('m3u8') ||
        contentType.startsWith('text/')

    if (isTextManifest) {
        const body = await upstream.text()
        if (isM3u8Playlist(contentType, body)) {
            return playlistResponse(body, upstream.url)
        }
        return new NextResponse(body, {
            status: upstream.status,
            headers: {
                'Content-Type': contentType || 'text/plain',
                'Cache-Control': 'private, no-store',
            },
        })
    }

    if (!contentType) {
        const buffer = Buffer.from(await upstream.arrayBuffer())
        const head = buffer.subarray(0, 8).toString('utf8')
        if (head.startsWith('#EXTM3U')) {
            return playlistResponse(buffer.toString('utf8'), upstream.url)
        }
        return new NextResponse(buffer, {
            status: upstream.status,
            headers: passthroughHeaders(upstream, 'application/octet-stream'),
        })
    }

    return new NextResponse(upstream.body, {
        status: upstream.status,
        headers: passthroughHeaders(upstream, 'application/octet-stream'),
    })
}
