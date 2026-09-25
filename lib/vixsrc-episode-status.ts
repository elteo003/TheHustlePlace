import { parseVixsrcApiSrc } from '@/lib/vixsrc-hls'

export type EpisodeProbeResult = 'available' | 'missing' | 'unknown'

export function classifyVixsrcEpisodeProbe(status: number, body: string): EpisodeProbeResult {
    if (status === 403 || status === 404) return 'missing'
    if (status >= 200 && status < 300 && parseVixsrcApiSrc(body)) return 'available'
    return 'unknown'
}

export function isConfirmedVixsrcMiss(error: string): boolean {
    return /\b(?:direct|allorigins|jina|home) 403\b/.test(error)
}
