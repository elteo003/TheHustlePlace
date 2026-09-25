export const EPISODE_PROBE_WINDOW_DAYS = 14

export function romeToday(now = new Date()): string {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Rome',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(now)
}

export function isoAirDate(value: string | null | undefined): string | null {
    if (!value) return null
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/)
    return match?.[1] ?? null
}

export function shiftIsoDate(iso: string, days: number): string {
    const [year, month, day] = iso.split('-').map(Number)
    const date = new Date(Date.UTC(year, month - 1, day))
    date.setUTCDate(date.getUTCDate() + days)
    return date.toISOString().slice(0, 10)
}

export function selectAiredEpisodes<T extends { air_date?: string | null }>(
    episodes: T[],
    today = romeToday()
): Array<T & { needsProbe: boolean }> {
    const dated = episodes
        .map((episode) => isoAirDate(episode.air_date))
        .filter((day): day is string => Boolean(day))
    const hasFuture = dated.some((day) => day > today)
    const probeFrom = shiftIsoDate(today, -EPISODE_PROBE_WINDOW_DAYS)

    return episodes.flatMap((episode) => {
        const day = isoAirDate(episode.air_date)
        if (!day) {
            if (hasFuture) return []
            return [{ ...episode, needsProbe: false }]
        }
        if (day > today) return []
        return [{ ...episode, needsProbe: day >= probeFrom }]
    })
}
