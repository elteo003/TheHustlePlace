import { Top10Content } from '@/types'

export const PLATFORM_TOP10_GAP = 4

export type PlatformChart = {
    slug: string
    label: string
    tmdbProviderId: number
}

export const PLATFORM_CHARTS: PlatformChart[] = [
    { slug: 'netflix', label: 'Netflix', tmdbProviderId: 8 },
    { slug: 'amazon', label: 'Amazon Prime', tmdbProviderId: 119 },
    { slug: 'disney', label: 'Disney+', tmdbProviderId: 337 },
    { slug: 'hbo', label: 'Max', tmdbProviderId: 384 },
    { slug: 'apple-tv', label: 'Apple TV+', tmdbProviderId: 350 },
    { slug: 'paramount-plus', label: 'Paramount+', tmdbProviderId: 531 },
    { slug: 'now', label: 'Now', tmdbProviderId: 39 },
]

export type PlatformTop10 = {
    platform: PlatformChart
    chartDate: string | null
    seriesTitle: string
    moviesTitle: string
    series: Top10Content[]
    movies: Top10Content[]
}

export type WeavableRail = {
    id: string
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

export function platformOn(now = new Date()): PlatformChart {
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
        chartDate: null,
        seriesTitle: seriesTitleFor(platform),
        moviesTitle: moviesTitleFor(platform),
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
    const cinema = rails.filter(isCinemaRail)
    const coming = rails.filter(isComingSoonRail)
    const body = rails.filter((rail) => !isCinemaRail(rail) && !isComingSoonRail(rail))
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

    const cinema = rails.filter(isCinemaRail)
    const coming = rails.filter(isComingSoonRail)
    const body = rails.filter(
        (rail) => !isCinemaRail(rail) && !isComingSoonRail(rail) && !isPlatformTop10Rail(rail)
    )
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
