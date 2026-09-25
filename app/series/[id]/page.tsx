'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { SeriesPlayer } from '@/components/series-player'
import { Season, TVShowDetails } from '@/types'
import { toast } from 'sonner'
import { PageSpinner } from '@/components/ui/spinner'
import { getLastWatchedEpisode, getResumeStartAt, getSeriesEpisodeProgress } from '@/lib/watch-history'
import { resolveSeriesResume } from '@/lib/series-resume'
import { getPlayerPath, isWatchableSearchParam } from '@/lib/content-navigation'
import { refineSeasonAvailability } from '@/lib/refine-season-availability'

export default function SeriesPage() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const seriesId = params.id as string
    const watchable = isWatchableSearchParam(searchParams.get('watch'))

    const [tvShow, setTVShow] = useState<TVShowDetails | null>(null)
    const [currentSeason, setCurrentSeason] = useState(1)
    const [currentEpisode, setCurrentEpisode] = useState(1)
    const [lastWatched, setLastWatched] = useState<{
        season: number
        episode: number
        progress: number
    } | null>(null)
    const [episodeProgress, setEpisodeProgress] = useState<
        Array<{ season: number; episode: number; progress: number }>
    >([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const requestRef = useRef(0)
    const selectionRef = useRef({ season: 1, episode: 1 })

    useEffect(() => {
        selectionRef.current = { season: currentSeason, episode: currentEpisode }
    }, [currentSeason, currentEpisode])

    useEffect(() => {
        fetchSeriesDetails()
    }, [seriesId, watchable])

    useEffect(() => {
        const numericId = parseInt(seriesId, 10)
        if (!Number.isFinite(numericId)) return
        const refreshProgress = () => {
            setLastWatched(getLastWatchedEpisode(numericId))
            setEpisodeProgress(getSeriesEpisodeProgress(numericId))
        }
        refreshProgress()
        window.addEventListener('watch-history-updated', refreshProgress)
        return () => window.removeEventListener('watch-history-updated', refreshProgress)
    }, [seriesId])

    const fetchSeriesDetails = async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await fetch(`/api/tmdb/tv/${seriesId}`)
            const data = await response.json()

            if (data.success && data.data) {
                const seriesData = data.data

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

                const numericId = parseInt(seriesId, 10)
                const watched = Number.isFinite(numericId) ? getLastWatchedEpisode(numericId) : null
                setLastWatched(watched)
                setEpisodeProgress(Number.isFinite(numericId) ? getSeriesEpisodeProgress(numericId) : [])

                const query = new URLSearchParams(window.location.search)
                const querySeason = parseInt(query.get('season') || '', 10)
                const queryEpisode = parseInt(query.get('episode') || '', 10)
                const resume = resolveSeriesResume({
                    querySeason: Number.isFinite(querySeason) ? querySeason : null,
                    queryEpisode: Number.isFinite(queryEpisode) ? queryEpisode : null,
                    lastWatched: watched,
                    seasons: seasonsWithEpisodes,
                })
                setCurrentSeason(resume.season)
                setCurrentEpisode(resume.episode)
                selectionRef.current = resume

                if (watchable) {
                    const requestId = ++requestRef.current
                    const numericSeriesId = parseInt(seriesId, 10)
                    void refineSeasonAvailability(numericSeriesId, seasonsWithEpisodes).then((refined) => {
                        if (requestRef.current !== requestId) return
                        const totalEpisodes = refined.reduce(
                            (total, season) => total + (season.episodes?.length || 0),
                            0
                        )
                        setTVShow((prev) =>
                            prev
                                ? {
                                      ...prev,
                                      seasons: refined,
                                      number_of_seasons: refined.length,
                                      number_of_episodes: totalEpisodes,
                                  }
                                : prev
                        )
                        const selected = selectionRef.current
                        const next = resolveSeriesResume({
                            querySeason: selected.season,
                            queryEpisode: selected.episode,
                            seasons: refined,
                        })
                        setCurrentSeason(next.season)
                        setCurrentEpisode(next.episode)
                    })
                }
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
                return data.data
            }

            return []
        } catch {
            return []
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
        const seriesTmdbId = parseInt(seriesId, 10)
        const runtime = tvShow?.seasons
            .find((item) => item.season_number === season)
            ?.episodes.find((item) => item.episode_number === episode)?.runtime
        router.push(
            getPlayerPath(seriesTmdbId, 'tv', {
                season,
                episode,
                startAt: getResumeStartAt(
                    seriesTmdbId,
                    'tv',
                    season,
                    episode,
                    runtime && runtime > 0 ? runtime * 60 : undefined
                ),
            })
        )
    }

    const handleAutoplayNext = (season: number, episode: number) => {
        setCurrentSeason(season)
        setCurrentEpisode(episode)
        router.push(getPlayerPath(parseInt(seriesId, 10), 'tv', { season, episode }))
    }

    if (loading) {
        return <PageSpinner />
    }

    if (error || !tvShow) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Serie TV non trovata</h1>
                    <p className="text-gray-400 mb-6">La serie TV richiesta non è disponibile.</p>
                    <button
                        onClick={() => router.back()}
                        className="btn-ghost-outline"
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
            lastWatched={lastWatched}
            episodeProgress={episodeProgress}
            onSeasonChange={handleSeasonChange}
            onEpisodeChange={handleEpisodeChange}
            onPlay={watchable ? handlePlay : undefined}
            onAutoplayNext={handleAutoplayNext}
        />
    )
}
