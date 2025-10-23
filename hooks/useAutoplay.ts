'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { TVShowDetails } from '@/types'

interface UseAutoplayProps {
    tvShow: TVShowDetails | null
    currentSeason: number
    currentEpisode: number
    onSeasonChange: (season: number) => void
    onEpisodeChange: (episode: number) => void
}

export function useAutoplay({
    tvShow,
    currentSeason,
    currentEpisode,
    onSeasonChange,
    onEpisodeChange
}: UseAutoplayProps) {
    const router = useRouter()

    const findNextEpisode = useCallback((seasonNumber: number, episodeNumber: number) => {
        if (!tvShow) return null

        const season = tvShow.seasons.find(s => s.season_number === seasonNumber)
        if (!season) return null

        const nextEpisodeInSeason = season.episodes.find(e => e.episode_number === episodeNumber + 1)
        if (nextEpisodeInSeason) {
            return { season: seasonNumber, episode: episodeNumber + 1 }
        }

        // Cerca nella prossima stagione
        const nextSeason = tvShow.seasons.find(s => s.season_number === seasonNumber + 1)
        if (nextSeason && nextSeason.episodes.length > 0) {
            return { season: seasonNumber + 1, episode: 1 }
        }

        return null
    }, [tvShow])

    const handleAutoplayNext = useCallback((season: number, episode: number) => {
        onSeasonChange(season)
        onEpisodeChange(episode)
        router.push(`/player/tv/${tvShow?.id}?season=${season}&episode=${episode}`)
    }, [tvShow?.id, onSeasonChange, onEpisodeChange, router])

    const handleEpisodeEnded = useCallback(() => {
        if (!tvShow) return

        const nextEpisode = findNextEpisode(currentSeason, currentEpisode)
        if (nextEpisode) {
            handleAutoplayNext(nextEpisode.season, nextEpisode.episode)
        } else {
            // Stagione completata
            console.log('🎉 Stagione completata!')
        }
    }, [tvShow, currentSeason, currentEpisode, findNextEpisode, handleAutoplayNext])

    return {
        findNextEpisode,
        handleAutoplayNext,
        handleEpisodeEnded
    }
}
