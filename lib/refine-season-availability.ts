import { Season } from '@/types'

interface TailAvailability {
    season: number
    episode: number
    available: boolean
}

export async function refineSeasonAvailability(tmdbId: number, seasons: Season[]): Promise<Season[]> {
    const episodes = seasons.flatMap((season) =>
        (season.episodes || [])
            .filter((episode) => episode.needsProbe)
            .map((episode) => ({
                season: season.season_number,
                episode: episode.episode_number,
            }))
    )

    try {
        const response = await fetch('/api/player/check-availability/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tmdbId, episodes }),
        })
        const data = await response.json()
        if (!data.success) return seasons

        const showListed = data.data?.showListed as boolean | null | undefined
        if (showListed == null) return seasons
        if (showListed === false) return []

        const missing = new Set(
            ((data.data?.availability || []) as TailAvailability[])
                .filter((item) => item.available === false)
                .map((item) => `${item.season}-${item.episode}`)
        )

        return seasons
            .map((season) => {
                const availableEpisodes = season.episodes.filter(
                    (episode) => !missing.has(`${season.season_number}-${episode.episode_number}`)
                )
                return {
                    ...season,
                    episodes: availableEpisodes,
                    episode_count: availableEpisodes.length,
                }
            })
            .filter((season) => season.episodes.length > 0)
    } catch {
        return seasons
    }
}
