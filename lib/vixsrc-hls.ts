import { VIXSRC_EDGE_CDN_HOST, VIXSRC_ORIGIN_HOST } from './vixsrc-cdn-allowlist'

export interface VixsrcMasterPlaylist {
    url: string
    token: string
    expires: string
    canPlayFHD: boolean
    videoId?: number
}

export function isVixsrcEdgeCdnHost(hostname: string): boolean {
    return VIXSRC_EDGE_CDN_HOST.test(hostname)
}

export function isVixsrcCdnHost(hostname: string): boolean {
    return hostname === 'vix-content.net' || hostname.endsWith('.vix-content.net') || isVixsrcEdgeCdnHost(hostname)
}

export function isAllowedHlsUrl(raw: string): boolean {
    try {
        const url = new URL(raw)
        return url.protocol === 'https:' && (VIXSRC_ORIGIN_HOST.test(url.hostname) || isVixsrcEdgeCdnHost(url.hostname))
    } catch {
        return false
    }
}

export function shouldProxyVixsrcCdn(raw: string): boolean {
    try {
        const url = new URL(raw)
        if (url.protocol !== 'https:') return false
        const host = url.hostname
        if (host === 'vix-content.net' || host.endsWith('.vix-content.net')) return false
        return isVixsrcEdgeCdnHost(host)
    } catch {
        return false
    }
}

export function rewriteEdgeCdnThroughProxy(body: string, origin: string): string {
    if (!origin) return body
    const base = origin.replace(/\/$/, '')
    return body.replace(/https:\/\/[^\s"']+/g, (match) => {
        if (!shouldProxyVixsrcCdn(match)) return match
        return `${base}/api/player/hls?u=${encodeURIComponent(match)}`
    })
}

/** True se c'è almeno una media playlist con EXTINF e URL di segmenti. */
export function hlsStreamLooksPlayable(stream: { parts: Record<string, string> }): boolean {
    return Object.values(stream.parts).some((text) => {
        const inf = (text.match(/#EXTINF/g) || []).length
        if (inf < 8) return false
        return /https:\/\//.test(text) || text.includes('/api/player/hls?u=')
    })
}

export function collectDroppedHlsHosts(body: string, sourceUrl: string): string[] {
    const hosts = new Set<string>()
    const consider = (ref: string) => {
        if (!ref || ref.startsWith('data:')) return
        try {
            const absolute = new URL(ref, sourceUrl).toString()
            if (isAllowedHlsUrl(absolute)) return
            hosts.add(new URL(absolute).hostname)
        } catch {
            return
        }
    }

    for (const line of body.split(/\r?\n/)) {
        const trimmed = line.trim()
        if (!trimmed) continue
        if (trimmed.startsWith('#')) {
            const re = /URI="([^"]+)"/gi
            let match: RegExpExecArray | null = re.exec(trimmed)
            while (match) {
                consider(match[1])
                match = re.exec(trimmed)
            }
            continue
        }
        consider(trimmed)
    }

    return [...hosts]
}

const RELAY_PUBLIC_HOST = /^(?:[a-z0-9-]+\.)+(?:trycloudflare\.com|cfargotunnel\.com)$/i

export function isAllowedRelayPublicUrl(raw: string): boolean {
    try {
        const url = new URL(raw)
        return url.protocol === 'https:' && RELAY_PUBLIC_HOST.test(url.hostname)
    } catch {
        return false
    }
}

export function buildHomeRelayFetchUrl(relayBase: string, target: string): string | null {
    if (!isAllowedHlsUrl(target)) return null
    try {
        const base = new URL(relayBase)
        if (base.protocol !== 'https:' && base.protocol !== 'http:') return null
        return `${base.origin}/fetch?u=${encodeURIComponent(target)}`
    } catch {
        return null
    }
}

export function decodeHtmlEntities(text: string): string {
    return text
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#0?39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
}

export function unwrapJinaBody(text: string): string {
    const marker = 'Markdown Content:'
    const index = text.indexOf(marker)
    return index >= 0 ? text.slice(index + marker.length).trim() : text
}

export function unwrapAllOriginsBody(text: string): string {
    const trimmed = text.trim()
    if (!trimmed.startsWith('{')) return text
    try {
        const json = JSON.parse(trimmed) as { contents?: unknown }
        return typeof json.contents === 'string' ? json.contents : text
    } catch {
        return text
    }
}

export function parseVixsrcApiSrc(text: string): string | null {
    const body = unwrapJinaBody(unwrapAllOriginsBody(text))
    const match = body.match(/\{"src":"([^"]+)"/)
    if (match?.[1]) return decodeHtmlEntities(match[1].replace(/\\\//g, '/'))
    try {
        const json = JSON.parse(body) as { src?: unknown }
        if (typeof json.src === 'string' && json.src.startsWith('/')) {
            return decodeHtmlEntities(json.src)
        }
    } catch {
        return null
    }
    return null
}

export function parseVixsrcEmbedHtml(html: string): VixsrcMasterPlaylist | null {
    const token = html.match(/['"]token['"]\s*:\s*['"]([^'"]+)['"]/)?.[1]
    const expires = html.match(/['"]expires['"]\s*:\s*['"]([^'"]+)['"]/)?.[1]
    const url =
        html.match(/masterPlaylist[\s\S]*?url:\s*['"]([^'"]+)['"]/)?.[1] ??
        html.match(/url:\s*['"](https?:\/\/[^'"]*playlist[^'"]*)['"]/)?.[1]
    if (!token || !expires || !url) return null

    const videoIdRaw = html.match(/window\.video\s*=\s*\{[\s\S]*?id:\s*['"](\d+)['"]/)?.[1]
    return {
        url,
        token,
        expires,
        canPlayFHD: /canPlayFHD\s*=\s*true/.test(html),
        videoId: videoIdRaw ? Number(videoIdRaw) : undefined,
    }
}

export function buildVixsrcPlaylistUrl(parsed: VixsrcMasterPlaylist, lang = 'it'): string {
    const playlist = new URL(parsed.url)
    playlist.searchParams.set('token', parsed.token)
    playlist.searchParams.set('expires', parsed.expires)
    playlist.searchParams.set('h', '1')
    playlist.searchParams.set('lang', lang)
    return playlist.toString()
}

export function resolvePlaylistRef(ref: string, sourceUrl: string): string | null {
    try {
        const absolute = new URL(ref, sourceUrl).toString()
        return isAllowedHlsUrl(absolute) ? absolute : null
    } catch {
        return null
    }
}

export function rewriteM3u8(body: string, sourceUrl: string, proxyPrefix: string): string {
    return body
        .split(/\r?\n/)
        .map((line) => {
            const trimmed = line.trim()
            if (!trimmed) return line
            if (trimmed.startsWith('#')) {
                return line.replace(/URI="([^"]+)"/gi, (_match, uri: string) => {
                    const absolute = resolvePlaylistRef(uri, sourceUrl)
                    return absolute ? `URI="${proxyPrefix}${encodeURIComponent(absolute)}"` : 'URI=""'
                })
            }
            const absolute = resolvePlaylistRef(trimmed, sourceUrl)
            return absolute ? `${proxyPrefix}${encodeURIComponent(absolute)}` : ''
        })
        .join('\n')
}

export function isM3u8Playlist(contentType: string, body: string): boolean {
    if (body.trimStart().startsWith('#EXTM3U')) return true
    const type = contentType.toLowerCase()
    return type.includes('mpegurl') || type.includes('m3u8')
}

export function isHlsManifestBuffer(bytes: Uint8Array): boolean {
    let head = ''
    const limit = Math.min(bytes.length, 32)
    for (let i = 0; i < limit; i++) {
        const code = bytes[i]
        if (code === 0) break
        head += String.fromCharCode(code)
    }
    return head.trimStart().startsWith('#EXTM3U')
}

export const VIXSRC_PART_PREFIX = '__PART__'

export type HlsRefKind = 'cdn' | 'playlist' | 'key' | 'drop'

export function classifyHlsRef(absolute: string): HlsRefKind {
    if (!isAllowedHlsUrl(absolute)) return 'drop'
    const url = new URL(absolute)
    if (isVixsrcCdnHost(url.hostname)) return 'cdn'
    if (url.pathname.includes('/storage/') || url.pathname.endsWith('.key')) return 'key'
    return 'playlist'
}

export function rewriteM3u8Browser(
    body: string,
    sourceUrl: string,
    resolveRef: (absolute: string, kind: Exclude<HlsRefKind, 'drop'>) => string
): string {
    return body
        .split(/\r?\n/)
        .map((line) => {
            const trimmed = line.trim()
            if (!trimmed) return line
            if (trimmed.startsWith('#')) {
                return line.replace(/URI="([^"]+)"/gi, (_match, uri: string) => {
                    const absolute = new URL(uri, sourceUrl).toString()
                    const kind = classifyHlsRef(absolute)
                    if (kind === 'drop') return 'URI=""'
                    return `URI="${resolveRef(absolute, kind)}"`
                })
            }
            const absolute = resolvePlaylistRef(trimmed, sourceUrl)
            if (!absolute) return ''
            const kind = classifyHlsRef(absolute)
            if (kind === 'drop') return ''
            return resolveRef(absolute, kind)
        })
        .join('\n')
}

export function bytesToBase64(bytes: Uint8Array): string {
    let binary = ''
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
    return btoa(binary)
}

export function createVixsrcBrowserSource(input: {
    master: string
    parts: Record<string, string>
    origin?: string
}) {
    const origin = input.origin ?? (typeof window !== 'undefined' ? window.location.origin : '')
    const created: string[] = []
    let master = rewriteEdgeCdnThroughProxy(input.master, origin)
    for (const [id, text] of Object.entries(input.parts)) {
        const rewritten = rewriteEdgeCdnThroughProxy(text, origin)
        const url = URL.createObjectURL(new Blob([rewritten], { type: 'application/vnd.apple.mpegurl' }))
        created.push(url)
        master = master.split(`${VIXSRC_PART_PREFIX}${id}.m3u8`).join(url)
    }
    const masterUrl = URL.createObjectURL(new Blob([master], { type: 'application/vnd.apple.mpegurl' }))
    created.push(masterUrl)
    return {
        url: masterUrl,
        revoke: () => {
            for (const url of created) URL.revokeObjectURL(url)
        },
    }
}
