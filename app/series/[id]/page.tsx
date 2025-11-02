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

            // Carica i dettagli della serie TV
            const response = await fetch(`/api/tmdb/tv/${seriesId}`)
            const data = await response.json()

            if (data.success && data.data) {
                const seriesData = data.data

                setLoadingMessage('Verifica disponibilità episodi su VixSrc...')
                // Carica le stagioni e gli episodi (con filtro disponibilità)
                const seasonsWithEpisodes = await loadSeasonsWithEpisodes(seriesId)

                // Calcola dinamicamente il numero di stagioni ed episodi dai dati reali
                const actualNumberOfSeasons = seasonsWithEpisodes.length
                const actualNumberOfEpisodes = seasonsWithEpisodes.reduce(
                    (total, season) => total + (season.episodes?.length || 0),
                    0
                )

                console.log(`📊 Conteggi dinamici - Stagioni: ${actualNumberOfSeasons}, Episodi: ${actualNumberOfEpisodes}`)

                const tvShowDetails: TVShowDetails = {
                    ...seriesData,
                    seasons: seasonsWithEpisodes,
                    number_of_seasons: actualNumberOfSeasons,  // Calcolato dinamicamente
                    number_of_episodes: actualNumberOfEpisodes, // Calcolato dinamicamente
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
            // Carica le stagioni e gli episodi reali da TMDB
            const response = await fetch(`/api/tmdb/tv/${seriesId}/seasons`)
            const data = await response.json()

            if (data.success && data.data) {
                console.log('✅ Stagioni caricate:', data.data.length, 'stagioni trovate')
                
                // Filtra gli episodi non disponibili su VixSrc
                const filteredSeasons = await filterAvailableEpisodes(seriesId, data.data)
                
                return filteredSeasons
            }

            console.warn('⚠️ Nessuna stagione trovata, uso fallback')
            return []
        } catch (error) {
            console.error('Errore nel caricamento delle stagioni:', error)
            return []
        }
    }

    const filterAvailableEpisodes = async (seriesId: string, seasons: any[]): Promise<any[]> => {
        try {
            console.log('🔍 Verifica disponibilità episodi su VixSrc...')
            
            // Crea un array di tutte le verifiche da fare (stagione, episodio)
            const availabilityChecks: Array<{
                seasonNumber: number
                episodeNumber: number
                episode: any
            }> = []

            seasons.forEach(season => {
                if (season.episodes && Array.isArray(season.episodes)) {
                    season.episodes.forEach((episode: any) => {
                        availabilityChecks.push({
                            seasonNumber: season.season_number,
                            episodeNumber: episode.episode_number,
                            episode
                        })
                    })
                }
            })

            console.log(`📺 Verificando disponibilità di ${availabilityChecks.length} episodi...`)

            // Verifica disponibilità in batch (5 alla volta per non sovraccaricare)
            const batchSize = 5
            const availableEpisodesMap = new Map<string, boolean>()

            for (let i = 0; i < availabilityChecks.length; i += batchSize) {
                const batch = availabilityChecks.slice(i, i + batchSize)
                
                const batchResults = await Promise.allSettled(
                    batch.map(async ({ seasonNumber, episodeNumber }) => {
                        try {
                            const checkResponse = await fetch(
                                `/api/player/check-availability?tmdbId=${seriesId}&type=tv&season=${seasonNumber}&episode=${episodeNumber}`
                            )
                            const checkData = await checkResponse.json()
                            
                            const key = `${seasonNumber}-${episodeNumber}`
                            return {
                                key,
                                available: checkData.success && checkData.data?.isAvailable === true
                            }
                        } catch (error) {
                            console.warn(`Errore verifica episodio S${seasonNumber}E${episodeNumber}:`, error)
                            return {
                                key: `${seasonNumber}-${episodeNumber}`,
                                available: false
                            }
                        }
                    })
                )

                batchResults.forEach(result => {
                    if (result.status === 'fulfilled') {
                        availableEpisodesMap.set(result.value.key, result.value.available)
                    }
                })

                // Piccola pausa tra i batch
                if (i + batchSize < availabilityChecks.length) {
                    await new Promise(resolve => setTimeout(resolve, 200))
                }
            }

            // Filtra gli episodi mantenendo solo quelli disponibili
            const filteredSeasons = seasons.map(season => {
                if (!season.episodes || !Array.isArray(season.episodes)) {
                    return season
                }

                const availableEpisodes = season.episodes.filter((episode: any) => {
                    const key = `${season.season_number}-${episode.episode_number}`
                    const isAvailable = availableEpisodesMap.get(key) ?? false
                    return isAvailable
                })

                const availableCount = availableEpisodes.length
                const totalCount = season.episodes.length
                
                if (availableCount < totalCount) {
                    console.log(`⚠️ Stagione ${season.season_number}: ${availableCount}/${totalCount} episodi disponibili`)
                }

                return {
                    ...season,
                    episodes: availableEpisodes,
                    episode_count: availableEpisodes.length // Aggiorna il conteggio
                }
            }).filter(season => season.episodes.length > 0) // Rimuovi stagioni senza episodi disponibili

            const totalAvailable = filteredSeasons.reduce((sum, s) => sum + s.episodes.length, 0)
            const totalOriginal = availabilityChecks.length
            
            console.log(`✅ Filtro completato: ${totalAvailable}/${totalOriginal} episodi disponibili su VixSrc`)

            return filteredSeasons
        } catch (error) {
            console.error('Errore nel filtro disponibilità episodi:', error)
            // In caso di errore, ritorna le stagioni originali
            return seasons
        }
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
                    <p className="text-white text-lg">{loadingMessage}</p>
                    {loadingMessage.includes('Verifica disponibilità') && (
                        <p className="text-gray-400 text-sm mt-2">
                            Questo può richiedere alcuni secondi...
                        </p>
                    )}
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
