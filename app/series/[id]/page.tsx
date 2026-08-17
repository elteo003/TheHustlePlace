'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SeriesPlayer } from '@/components/series-player'
import { Season, TVShowDetails } from '@/types'
import { toast } from 'sonner'

export default function SeriesPage() {
    const params = useParams()
    const router = useRouter()
    const seriesId = params.id as string

    const [tvShow, setTVShow] = useState<TVShowDetails | null>(null)
    const [currentSeason, setCurrentSeason] = useState(1)
    const [currentEpisode, setCurrentEpisode] = useState(1)
    const [loading, setLoading] = useState(true)
    const [loadingMessage, setLoadingMessage] = useState('Caricamento serie TV...')
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchSeriesDetails()
    }, [seriesId])

    const fetchSeriesDetails = async () => {
        try {
            setLoading(true)
            setError(null)
            setLoadingMessage('Caricamento serie TV...')

            const response = await fetch(`/api/tmdb/tv/${seriesId}`)
            const data = await response.json()

            if (data.success && data.data) {
                const seriesData = data.data

                setLoadingMessage('Preparazione episodi...')
                const seasonsWithEpisodes = await loadSeasonsWithEpisodes(seriesId)

                const actualNumberOfSeasons = seasonsWithEpisodes.length
                const actualNumberOfEpisodes = seasonsWithEpisodes.reduce(
                    (total, season) => total + (season.episodes?.length || 0),
                    0
                )

                const tvShowDetails: TVShowDetails = {
                    ...seriesData,
                    seasons: seasonsWithEpisodes,
                    number_of_seasons: actualNumberOfSeasons,
                    number_of_episodes: actualNumberOfEpisodes,
                    genres: seriesData.genres || [],
                }

                setTVShow(tvShowDetails)
                setCurrentSeason(1)
                setCurrentEpisode(1)
            } else {
                throw new Error('Serie TV non trovata')
            }
        } catch {
            setError('Errore nel caricamento della serie TV')
            toast.error('Impossibile caricare i dettagli della serie TV')
        } finally {
            setLoading(false)
        }
    }

    const loadSeasonsWithEpisodes = async (id: string): Promise<Season[]> => {
        try {
            const response = await fetch(`/api/tmdb/tv/${id}/seasons`)
            const data = await response.json()

            if (data.success && data.data) {
                return filterAvailableEpisodes(id, data.data)
            }

            return []
        } catch {
            return []
        }
    }

    const filterAvailableEpisodes = async (id: string, seasons: Season[]): Promise<Season[]> => {
        const episodes = seasons.flatMap((season) =>
            (season.episodes || []).map((episode) => ({
                season: season.season_number,
                episode: episode.episode_number,
            }))
        )

        if (episodes.length === 0) {
            return seasons
        }

        try {
            const response = await fetch('/api/player/check-availability/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tmdbId: parseInt(id, 10), episodes }),
            })
            const data = await response.json()

            if (!data.success || !Array.isArray(data.data?.availability)) {
                return seasons
            }

            const availableSet = new Set(
                data.data.availability
                    .filter((item: { available: boolean }) => item.available)
                    .map((item: { season: number; episode: number }) => `${item.season}-${item.episode}`)
            )

            return seasons
                .map((season) => {
                    const availableEpisodes = (season.episodes || []).filter((episode) =>
                        availableSet.has(`${season.season_number}-${episode.episode_number}`)
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

    const handleSeasonChange = (season: number) => {
        setCurrentSeason(season)
        setCurrentEpisode(1)
    }

    const handleEpisodeChange = (episode: number) => {
        setCurrentEpisode(episode)
    }

    const handlePlay = (season: number, episode: number) => {
        router.push(`/player/tv/${seriesId}?season=${season}&episode=${episode}`)
    }

    const handleAutoplayNext = (season: number, episode: number) => {
        setCurrentSeason(season)
        setCurrentEpisode(episode)
        router.push(`/player/tv/${seriesId}?season=${season}&episode=${episode}`)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white text-lg">{loadingMessage}</p>
                </div>
            </div>
        )
    }

    if (error || !tvShow) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Serie TV non trovata</h1>
                    <p className="text-gray-400 mb-6">La serie TV richiesta non è disponibile.</p>
                    <button
                        onClick={() => router.back()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                        Torna indietro
                    </button>
                </div>
            </div>
        )
    }

    return (
        <SeriesPlayer
            tvShow={tvShow}
            currentSeason={currentSeason}
            currentEpisode={currentEpisode}
            onSeasonChange={handleSeasonChange}
            onEpisodeChange={handleEpisodeChange}
            onPlay={handlePlay}
            onAutoplayNext={handleAutoplayNext}
        />
    )
}
