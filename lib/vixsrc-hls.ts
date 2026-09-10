export interface VixsrcMasterPlaylist {
    url: string
    token: string
    expires: string
    canPlayFHD: boolean
    videoId?: number
}

const ALLOWED_HOST = /^(?:[a-z0-9-]+\.)*(?:vixsrc\.to|vix-content\.net)$/i

export function isAllowedHlsUrl(raw: string): boolean {
    try {
        const url = new URL(raw)
        return url.protocol === 'https:' && ALLOWED_HOST.test(url.hostname)
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
    const type = contentType.toLowerCase()
    if (type.includes('mpegurl') || type.includes('m3u8')) return true
    return body.trimStart().startsWith('#EXTM3U')
}

export const VIXSRC_PART_PREFIX = '__PART__'

export type HlsRefKind = 'cdn' | 'playlist' | 'key' | 'drop'

export function classifyHlsRef(absolute: string): HlsRefKind {
    if (!isAllowedHlsUrl(absolute)) return 'drop'
    const url = new URL(absolute)
    if (url.hostname.endsWith('vix-content.net')) return 'cdn'
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

export function createVixsrcBrowserSource(input: { master: string; parts: Record<string, string> }) {
    const created: string[] = []
    let master = input.master
    for (const [id, text] of Object.entries(input.parts)) {
        const url = URL.createObjectURL(new Blob([text], { type: 'application/vnd.apple.mpegurl' }))
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
