'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SeriesPlayer } from '@/components/series-player'
import { TVShowDetails, Episode } from '@/types'
import { toast } from '@/components/ui/use-toast'

export default function SeriesPage() {
    const params = useParams()
    const router = useRouter()
    const seriesId = params.id as string

    const [tvShow, setTVShow] = useState<TVShowDetails | null>(null)
    const [currentSeason, setCurrentSeason] = useState(1)
    const [currentEpisode, setCurrentEpisode] = useState(1)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchSeriesDetails()
    }, [seriesId])

    const fetchSeriesDetails = async () => {
        try {
            setLoading(true)
            setError(null)

            // Carica i dettagli della serie TV
            const response = await fetch(`/api/tmdb/tv/${seriesId}`)
            const data = await response.json()

            if (data.success && data.data) {
                const seriesData = data.data
                
                // Carica le stagioni e gli episodi
                const seasonsWithEpisodes = await loadSeasonsWithEpisodes(seriesId)
                
                const tvShowDetails: TVShowDetails = {
                    ...seriesData,
                    seasons: seasonsWithEpisodes,
                    genres: seriesData.genres || []
                }

                setTVShow(tvShowDetails)
                setCurrentSeason(1)
                setCurrentEpisode(1)
            } else {
                throw new Error('Serie TV non trovata')
            }
        } catch (error) {
            console.error('Errore nel caricamento della serie TV:', error)
            setError('Errore nel caricamento della serie TV')
            toast({
                title: "Errore",
                description: "Impossibile caricare i dettagli della serie TV",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const loadSeasonsWithEpisodes = async (seriesId: string): Promise<any[]> => {
        try {
            // Per ora simuliamo i dati delle stagioni
            // In un'app reale, faresti chiamate API per ogni stagione
            const mockSeasons = [
                {
                    id: 1,
                    season_number: 1,
                    name: "Stagione 1",
                    overview: "La prima stagione della serie",
                    air_date: "2023-01-01",
                    poster_path: null,
                    episode_count: 8,
                    episodes: generateMockEpisodes(1, 8)
                },
                {
                    id: 2,
                    season_number: 2,
                    name: "Stagione 2",
                    overview: "La seconda stagione della serie",
                    air_date: "2023-06-01",
                    poster_path: null,
                    episode_count: 10,
                    episodes: generateMockEpisodes(2, 10)
                }
            ]

            return mockSeasons
        } catch (error) {
            console.error('Errore nel caricamento delle stagioni:', error)
            return []
        }
    }

    const generateMockEpisodes = (seasonNumber: number, episodeCount: number): Episode[] => {
        return Array.from({ length: episodeCount }, (_, index) => ({
            id: seasonNumber * 1000 + index + 1,
            episode_number: index + 1,
            name: `Episodio ${index + 1}`,
            overview: `Descrizione dell'episodio ${index + 1} della stagione ${seasonNumber}.`,
            air_date: new Date(2023, seasonNumber - 1, index + 1).toISOString().split('T')[0],
            still_path: undefined,
            runtime: 45 + Math.floor(Math.random() * 15), // 45-60 minuti
            vote_average: 7 + Math.random() * 2, // 7-9 rating
            season_number: seasonNumber
        }))
    }

    const handleSeasonChange = (season: number) => {
        setCurrentSeason(season)
        setCurrentEpisode(1) // Reset al primo episodio
    }

    const handleEpisodeChange = (episode: number) => {
        setCurrentEpisode(episode)
    }

    const handlePlay = (season: number, episode: number) => {
        // Naviga al player dell'episodio
        router.push(`/player/tv/${seriesId}?season=${season}&episode=${episode}`)
    }

    const handleAutoplayNext = (season: number, episode: number) => {
        // Aggiorna lo stato e naviga al prossimo episodio
        setCurrentSeason(season)
        setCurrentEpisode(episode)
        router.push(`/player/tv/${seriesId}?season=${season}&episode=${episode}`)
    }

    // Gestisce l'autoplay quando l'episodio finisce
    const handleEpisodeEnded = () => {
        if (!tvShow) return

        const currentSeasonData = tvShow.seasons.find(s => s.season_number === currentSeason)
        if (!currentSeasonData) return

        // Trova il prossimo episodio
        const nextEpisode = currentSeasonData.episodes.find(e => e.episode_number === currentEpisode + 1)
        if (nextEpisode) {
            // Prossimo episodio nella stessa stagione
            handleAutoplayNext(currentSeason, currentEpisode + 1)
        } else {
            // Cerca nella prossima stagione
            const nextSeason = tvShow.seasons.find(s => s.season_number === currentSeason + 1)
            if (nextSeason && nextSeason.episodes.length > 0) {
                handleAutoplayNext(currentSeason + 1, 1)
            } else {
                // Stagione completata
                toast({
                    title: "Stagione completata!",
                    description: "Hai finito di guardare tutti gli episodi disponibili.",
                    variant: "default"
                })
            }
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-lg">Caricamento serie TV...</p>
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
