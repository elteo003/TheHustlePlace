import { ContentType } from '@/lib/content-navigation'

export const LIVING_ROOT = '/living'

export function livingHomePath(): string {
    return `${LIVING_ROOT}/home`
}

export function livingMoviesPath(): string {
    return `${LIVING_ROOT}/movies`
}

export function livingSeriesPath(): string {
    return `${LIVING_ROOT}/series`
}

export function livingSearchPath(): string {
    return `${LIVING_ROOT}/search`
}

export function livingDetailsPath(id: number, type: ContentType): string {
    return type === 'tv' ? `${LIVING_ROOT}/series/${id}` : `${LIVING_ROOT}/movie/${id}`
}

export function livingPlayerPath(
    id: number,
    type: ContentType,
    options?: { season?: number; episode?: number; startAt?: number }
): string {
    const params = new URLSearchParams()
    if (options?.startAt != null && options.startAt > 0) {
        params.set('startAt', String(Math.floor(options.startAt)))
    }
    if (type === 'tv') {
        if (options?.season != null) params.set('season', String(options.season))
        if (options?.episode != null) params.set('episode', String(options.episode))
        const query = params.toString()
        return query ? `${LIVING_ROOT}/player/tv/${id}?${query}` : `${LIVING_ROOT}/player/tv/${id}`
    }
    const query = params.toString()
    return query ? `${LIVING_ROOT}/player/movie/${id}?${query}` : `${LIVING_ROOT}/player/movie/${id}`
}

export function isLivingPath(pathname: string | null | undefined): boolean {
    return Boolean(pathname?.startsWith(LIVING_ROOT))
}

export function isWebosUserAgent(ua: string): boolean {
    return /webos|web0s|netcast/i.test(ua)
}
