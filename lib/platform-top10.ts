import { Top10Content } from '@/types'

export const PLATFORM_TOP10_GAP = 4

export type PlatformChart = {
    slug: string
    label: string
    tmdbProviderId: number
    region?: 'IT' | 'US'
    brandColor?: string
    accentColor?: string
}

export const STUDIOS_AND_PLATFORMS: PlatformChart[] = [
    { slug: 'netflix', label: 'Netflix', tmdbProviderId: 8, region: 'IT', brandColor: '#E50914', accentColor: '#B20710' },
    { slug: 'amazon', label: 'Prime Video', tmdbProviderId: 119, region: 'IT', brandColor: '#00A8E1', accentColor: '#007eb9' },
    { slug: 'apple-tv', label: 'Apple TV+', tmdbProviderId: 350, region: 'IT', brandColor: '#FFFFFF', accentColor: '#2b2b2b' },
    { slug: 'crunchyroll', label: 'Crunchyroll', tmdbProviderId: 283, region: 'IT', brandColor: '#F47521', accentColor: '#d65b0b' },
    { slug: 'disney', label: 'Disney+', tmdbProviderId: 337, region: 'IT', brandColor: '#113CCF', accentColor: '#0c2889' },
    { slug: 'hulu', label: 'Hulu', tmdbProviderId: 15, region: 'US', brandColor: '#1CE783', accentColor: '#00ed82' },
    { slug: 'hbo', label: 'HBO Max', tmdbProviderId: 1899, region: 'US', brandColor: '#9933FF', accentColor: '#5822b4' },
    { slug: 'paramount-plus', label: 'Paramount+', tmdbProviderId: 531, region: 'IT', brandColor: '#0064FF', accentColor: '#0047b3' },
    { slug: 'peacock', label: 'Peacock', tmdbProviderId: 386, region: 'US', brandColor: '#00A859', accentColor: '#006b38' },
    { slug: 'discovery-plus', label: 'Discovery+', tmdbProviderId: 546, region: 'IT', brandColor: '#003B64', accentColor: '#002540' },
    { slug: 'now', label: 'Now', tmdbProviderId: 39, region: 'IT', brandColor: '#00887A', accentColor: '#005f55' },
]

export function findPlatformBySlug(slug: string): PlatformChart | undefined {
    return STUDIOS_AND_PLATFORMS.find((p) => p.slug === slug)
}

export const PLATFORM_CHARTS: PlatformChart[] = [
    { slug: 'netflix', label: 'Netflix', tmdbProviderId: 8, region: 'IT' },
    { slug: 'amazon', label: 'Amazon Prime', tmdbProviderId: 119, region: 'IT' },
    { slug: 'disney', label: 'Disney+', tmdbProviderId: 337, region: 'IT' },
    { slug: 'hbo', label: 'Max', tmdbProviderId: 1899, region: 'US' },
    { slug: 'apple-tv', label: 'Apple TV+', tmdbProviderId: 350, region: 'IT' },
    { slug: 'paramount-plus', label: 'Paramount+', tmdbProviderId: 531, region: 'IT' },
    { slug: 'now', label: 'Now', tmdbProviderId: 39, region: 'IT' },
]

export type PlatformTop10 = {
    platform: PlatformChart | null
    isFreeDay?: boolean
    chartDate: string | null
    seriesTitle: string
    moviesTitle: string
    series: Top10Content[]
    movies: Top10Content[]
}

export type PlatformHubData = {
    platform: PlatformChart
    seriesTop10: Top10Content[]
    moviesTop10: Top10Content[]
    popularSeries: Top10Content[]
    popularMovies: Top10Content[]
    recentTitles: Top10Content[]
    matchingHistoryIds: number[]
}

export type WeavableRail = {
    id?: string
    title: string
    items?: unknown[]
}

export function romeDayKey(now = new Date()): string {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Rome',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(now)
}

export function isFreeDay(now = new Date()): boolean {
    const key = romeDayKey(now)
    const [year, month, day] = key.split('-').map(Number)
    const index = Math.floor(Date.UTC(year, month - 1, day) / 86_400_000)
    return (Math.abs(index) % 7) === 3
}

export function platformOn(now = new Date()): PlatformChart | null {
    if (isFreeDay(now)) {
        return null
    }
    const key = romeDayKey(now)
    const [year, month, day] = key.split('-').map(Number)
    const index = Math.floor(Date.UTC(year, month - 1, day) / 86_400_000)
    return PLATFORM_CHARTS[Math.abs(index) % PLATFORM_CHARTS.length]
}

export function seriesTitleFor(platform: PlatformChart): string {
    return `Top 10 serie TV da ${platform.label}`
}

export function moviesTitleFor(platform: PlatformChart): string {
    return `Top 10 film da ${platform.label}`
}

export function emptyPlatformTop10(now = new Date()): PlatformTop10 {
    const platform = platformOn(now)
    return {
        platform,
        isFreeDay: platform === null,
        chartDate: null,
        seriesTitle: platform ? seriesTitleFor(platform) : '',
        moviesTitle: platform ? moviesTitleFor(platform) : '',
        series: [],
        movies: [],
    }
}

export function isComingSoonRail(rail: WeavableRail): boolean {
    return rail.id === 'soon' || rail.id === 'coming-soon' || rail.title === 'In arrivo'
}

export function isCinemaRail(rail: WeavableRail): boolean {
    return (
        rail.id === 'cine' ||
        rail.id === 'coming-to-cinema' ||
        rail.title === 'Presto al cinema'
    )
}

export function pinTailRails<T extends WeavableRail>(rails: T[]): T[] {
    const cinema: T[] = []
    const coming: T[] = []
    const body: T[] = []
    for (const rail of rails) {
        if (isCinemaRail(rail)) cinema.push(rail)
        else if (isComingSoonRail(rail)) coming.push(rail)
        else body.push(rail)
    }
    return [...body, ...cinema, ...coming]
}

export function isGeneralTop10Rail(rail: WeavableRail): boolean {
    return (
        rail.id === 'top' ||
        rail.id === 'trending' ||
        rail.title === 'Top 10' ||
        rail.title === 'Top 10 Titoli Oggi'
    )
}

export function isPlatformTop10Rail(rail: WeavableRail): boolean {
    return rail.id === 'platform-top10-tv' || rail.id === 'platform-top10-movie' || rail.id === 'ptv' || rail.id === 'pmov'
}

export function weavePlatformTop10s<T extends WeavableRail>(
    rails: T[],
    inserts: T[],
    gap = PLATFORM_TOP10_GAP
): T[] {
    const filled = inserts.filter((item) => (item.items?.length ?? 0) > 0)
    if (!filled.length) return pinTailRails(rails)

    const cinema: T[] = []
    const coming: T[] = []
    const body: T[] = []
    for (const rail of rails) {
        if (isCinemaRail(rail)) cinema.push(rail)
        else if (isComingSoonRail(rail)) coming.push(rail)
        else if (!isPlatformTop10Rail(rail)) body.push(rail)
    }
    const topIdx = body.findIndex(isGeneralTop10Rail)
    if (topIdx < 0) {
        return [...body, ...filled, ...cinema, ...coming]
    }

    const out = body.slice(0, topIdx + 1)
    const rest = body.slice(topIdx + 1)
    let counted = 0
    let insertIndex = 0
    for (const rail of rest) {
        out.push(rail)
        counted += 1
        if (insertIndex < filled.length && counted === gap) {
            out.push(filled[insertIndex])
            insertIndex += 1
            counted = 0
        }
    }
    while (insertIndex < filled.length) {
        out.push(filled[insertIndex])
        insertIndex += 1
    }
    return [...out, ...cinema, ...coming]
}
