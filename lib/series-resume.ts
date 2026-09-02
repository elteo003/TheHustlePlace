export interface ResumeSeason {
    season_number: number
    episodes: Array<{ episode_number: number }>
}

export interface ResumePosition {
    season: number
    episode: number
}

function episodeExists(seasons: ResumeSeason[], season: number, episode: number): boolean {
    const seasonData = seasons.find((item) => item.season_number === season)
    return Boolean(seasonData?.episodes.some((item) => item.episode_number === episode))
}

export function resolveSeriesResume(input: {
    querySeason?: number | null
    queryEpisode?: number | null
    lastWatched?: ResumePosition | null
    seasons: ResumeSeason[]
}): ResumePosition {
    const candidates: Array<ResumePosition | null | undefined> = [
        input.querySeason != null && input.queryEpisode != null
            ? { season: input.querySeason, episode: input.queryEpisode }
            : null,
        input.lastWatched,
    ]

    for (const candidate of candidates) {
        if (!candidate) continue
        if (candidate.season < 1 || candidate.episode < 1) continue
        if (input.seasons.length === 0 || episodeExists(input.seasons, candidate.season, candidate.episode)) {
            return candidate
        }
    }

    const firstSeason = input.seasons[0]
    const firstEpisode = firstSeason?.episodes[0]
    return {
        season: firstSeason?.season_number ?? 1,
        episode: firstEpisode?.episode_number ?? 1,
    }
}
