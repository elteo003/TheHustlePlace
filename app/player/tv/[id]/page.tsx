'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, Settings } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { VideoPlayerService } from '@/services/video-player.service'
import { TVShowDetails } from '@/types'

interface TVShow {
    id: number
    tmdb_id?: number
    name: string
    overview: string
    poster_path: string
    backdrop_path: string
    first_air_date: string
    vote_average: number
    number_of_seasons?: number
    number_of_episodes?: number
    genres?: Array<{ id: number; name: string }>
}

export default function TVPlayerPage() {
    const params = useParams()
    const searchParams = useSearchParams()
    const router = useRouter()
    const tvId = params.id as string
    const season = searchParams.get('season') || '1'
    const episode = searchParams.get('episode') || '1'

    const [tvShow, setTVShow] = useState<TVShow | null>(null)
    const [tvShowDetails, setTVShowDetails] = useState<TVShowDetails | null>(null)
    const [loading, setLoading] = useState(true)
    const [videoError, setVideoError] = useState<string | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const videoPlayerService = new VideoPlayerService()

    useEffect(() => {
        fetchTVShowDetails()
        setVideoError(null) // Reset errore quando cambia la serie
    }, [tvId, season, episode])

    const fetchTVShowDetails = async () => {
        try {
            console.log('🔍 Recupero dettagli serie TV per ID:', tvId)

            // Usa direttamente l'API TMDB per ottenere i dettagli della serie TV
            const response = await fetch(`/api/tmdb/tv/${tvId}`)

            if (!response.ok) {
                throw new Error('Errore nel recupero serie TV da TMDB')
            }

            const data = await response.json()
            console.log('📊 Dati serie TV TMDB:', data)

            if (data.success && data.data) {
                const tmdbTVShow = data.data
                console.log('✅ Serie TV trovata su TMDB:', tmdbTVShow.name)

                // Carica le stagioni per calcolare dinamicamente i conteggi
                let actualSeasons = tmdbTVShow.number_of_seasons || 1
                let actualEpisodes = tmdbTVShow.number_of_episodes || 1
                let seasonsDataLoaded: any[] = []
                
                try {
                    const seasonsResponse = await fetch(`/api/tmdb/tv/${tvId}/seasons`)
                    const seasonsData = await seasonsResponse.json()
                    
                    if (seasonsData.success && seasonsData.data && Array.isArray(seasonsData.data)) {
                        seasonsDataLoaded = seasonsData.data
                        actualSeasons = seasonsData.data.length
                        actualEpisodes = seasonsData.data.reduce(
                            (total: number, season: any) => total + (season.episodes?.length || 0),
                            0
                        )
                        console.log(`📊 Conteggi dinamici nel player - Stagioni: ${actualSeasons}, Episodi: ${actualEpisodes}`)
                    }
                } catch (seasonsError) {
                    console.warn('⚠️ Impossibile caricare le stagioni per calcolo dinamico, uso valori TMDB:', seasonsError)
                }

                // Converti i dati TMDB nel formato del player
                const tvShowData: TVShow = {
                    id: tmdbTVShow.id,
                    tmdb_id: tmdbTVShow.id,
                    name: tmdbTVShow.name,
                    overview: tmdbTVShow.overview,
                    poster_path: tmdbTVShow.poster_path,
                    backdrop_path: tmdbTVShow.backdrop_path,
                    first_air_date: tmdbTVShow.first_air_date,
                    vote_average: tmdbTVShow.vote_average,
                    number_of_seasons: actualSeasons,  // Calcolato dinamicamente quando possibile
                    number_of_episodes: actualEpisodes, // Calcolato dinamicamente quando possibile
                    genres: tmdbTVShow.genres || []
                }

                setTVShow(tvShowData)

                // Salva anche i dettagli completi per l'autoplay (con le stagioni)
                if (seasonsDataLoaded.length > 0) {
                    setTVShowDetails({
                        ...tvShowData,
                        seasons: seasonsDataLoaded,
                        number_of_seasons: actualSeasons,
                        number_of_episodes: actualEpisodes,
                        genres: tmdbTVShow.genres || []
                    } as TVShowDetails)
                }

                console.log('✅ Serie TV configurata:', tvShowData.name, 'TMDB ID:', tvShowData.tmdb_id)
            } else {
                console.log('❌ Serie TV non trovata su TMDB, uso fallback con TMDB ID:', tvId)

                // Fallback: usa dati minimi se la serie TV non è trovata
                const fallbackTVShow: TVShow = {
                    id: parseInt(tvId),
                    tmdb_id: parseInt(tvId),
                    name: `Serie TV ${tvId}`,
                    overview: `Serie TV disponibile su vixsrc.to con TMDB ID ${tvId}. Se la serie non si carica, potrebbe non essere disponibile su VixSrc.`,
                    poster_path: "/placeholder-movie.svg",
                    backdrop_path: "/placeholder-movie.svg",
                    first_air_date: "",
                    vote_average: 0,
                    number_of_seasons: 1,
                    number_of_episodes: 1,
                    genres: []
                }
                setTVShow(fallbackTVShow)
            }

            setLoading(false)
        } catch (error) {
            console.error('❌ Errore nel caricamento della serie TV:', error)

            // Fallback: usa dati minimi in caso di errore
            const fallbackTVShow: TVShow = {
                id: parseInt(tvId),
                tmdb_id: parseInt(tvId),
                name: `Serie TV ${tvId}`,
                overview: `Serie TV disponibile su vixsrc.to con TMDB ID ${tvId}. Se la serie non si carica, potrebbe non essere disponibile su VixSrc.`,
                poster_path: "/placeholder-movie.svg",
                backdrop_path: "/placeholder-movie.svg",
                first_air_date: "",
                vote_average: 0,
                number_of_seasons: 1,
                number_of_episodes: 1,
                genres: []
            }
            setTVShow(fallbackTVShow)
            setLoading(false)
        }
    }

    const handlePlayPause = () => {
        setIsPlaying(!isPlaying)
        toast({
            title: isPlaying ? "Riproduzione in pausa" : "Riproduzione avviata",
            description: `${tvShow?.name} - Stagione ${season}, Episodio ${episode}`
        })
    }

    const handleMuteToggle = () => {
        setIsMuted(!isMuted)
    }

    const handleBack = () => {
        router.back()
    }

    // Funzione per trovare il prossimo episodio
    const findNextEpisode = useCallback((currentSeasonNum: number, currentEpisodeNum: number) => {
        if (!tvShowDetails || !tvShowDetails.seasons) return null

        const currentSeason = tvShowDetails.seasons.find(s => s.season_number === currentSeasonNum)
        if (!currentSeason) return null

        // Cerca il prossimo episodio nella stessa stagione
        const nextEpisodeInSeason = currentSeason.episodes.find(e => e.episode_number === currentEpisodeNum + 1)
        if (nextEpisodeInSeason) {
            return { season: currentSeasonNum, episode: currentEpisodeNum + 1 }
        }

        // Cerca nella prossima stagione
        const nextSeason = tvShowDetails.seasons.find(s => s.season_number === currentSeasonNum + 1)
        if (nextSeason && nextSeason.episodes.length > 0) {
            return { season: currentSeasonNum + 1, episode: 1 }
        }

        return null
    }, [tvShowDetails])

    // Funzione per gestire la fine dell'episodio
    const handleEpisodeEnded = useCallback(() => {
        console.log('🎬 Episodio terminato, cerco il prossimo...')
        
        const nextEpisode = findNextEpisode(parseInt(season), parseInt(episode))
        
        if (nextEpisode) {
            console.log(`✅ Prossimo episodio trovato: S${nextEpisode.season}E${nextEpisode.episode}`)
            
            toast({
                title: "Prossimo episodio",
                description: `Caricamento episodio ${nextEpisode.episode} della stagione ${nextEpisode.season}...`
            })

            // Naviga al prossimo episodio
            router.push(`/player/tv/${tvId}?season=${nextEpisode.season}&episode=${nextEpisode.episode}`)
        } else {
            console.log('🎉 Tutti gli episodi completati!')
            
            toast({
                title: "Serie completata!",
                description: "Hai finito di guardare tutti gli episodi disponibili.",
                variant: "default"
            })

            // Torna alla pagina della serie
            setTimeout(() => {
                router.push(`/series/${tvId}`)
            }, 3000)
        }
    }, [season, episode, tvId, findNextEpisode, router])

    // Listener per gli eventi postMessage dal player VixSrc
    const handlePlayerEvent = useCallback((event: MessageEvent) => {
        try {
            // Verifica che l'evento provenga da vixsrc.to
            if (!event.origin || !event.origin.includes('vixsrc.to')) {
                return
            }

            if (!event.data || typeof event.data !== 'object') {
                return
            }

            const { type: eventType, data } = event.data as any

            switch (eventType) {
                case 'play':
                    setIsPlaying(true)
                    break
                case 'pause':
                    setIsPlaying(false)
                    break
                case 'timeupdate':
                    if (typeof data?.time === 'number') {
                        setCurrentTime(data.time)
                    }
                    if (typeof data?.duration === 'number') {
                        setDuration(data.duration)
                    }
                    break
                case 'ended':
                    console.log('📺 Evento ended ricevuto dal player VixSrc')
                    setIsPlaying(false)
                    handleEpisodeEnded()
                    break
            }
        } catch (error) {
            console.error('Errore nella gestione evento player:', error)
        }
    }, [handleEpisodeEnded])

    // Setup event listener per i messaggi dal player
    useEffect(() => {
        window.addEventListener('message', handlePlayerEvent)
        return () => window.removeEventListener('message', handlePlayerEvent)
    }, [handlePlayerEvent])

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        )
    }

    if (!tvShow) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white text-xl">Serie TV non trovata</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-50 p-6">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="text-white hover:bg-white/20"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Indietro
                </Button>
            </div>

            {/* Video Player Area */}
            <div className="relative w-full h-screen bg-gradient-to-b from-gray-900 to-black">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-30"
                    style={{
                        backgroundImage: `url(https://image.tmdb.org/t/p/original${tvShow.backdrop_path})`
                    }}
                />

                {/* Video Player */}
                <div className="relative z-10 w-full h-full">
                    {videoError ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center max-w-md mx-auto px-6">
                                <div className="text-6xl mb-4">⚠️</div>
                                <h2 className="text-2xl font-bold text-white mb-4">Episodio non disponibile</h2>
                                <p className="text-gray-300 mb-6">
                                    L'episodio {episode} della stagione {season} di "{tvShow.name}" non è attualmente disponibile su VixSrc.
                                </p>
                                <div className="flex flex-col space-y-3">
                                    <Button
                                        onClick={() => {
                                            setVideoError(null)
                                            window.location.reload()
                                        }}
                                        className="bg-white text-black hover:bg-gray-200"
                                    >
                                        Riprova
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => router.push(`/series/${tvShow.id}`)}
                                        className="border-white/30 text-white hover:bg-white/10"
                                    >
                                        Torna alla serie
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <iframe
                            src={videoPlayerService.getPlayerUrl(tvShow.tmdb_id || tvShow.id, 'tv', parseInt(season), parseInt(episode))}
                            className="w-full h-full border-0"
                            allowFullScreen
                            title={`${tvShow.name} - Stagione ${season}, Episodio ${episode}`}
                            allow="autoplay; fullscreen; picture-in-picture; encrypted-media; web-share"
                            loading="lazy"
                            onLoad={() => {
                                setVideoError(null)
                                // Verifica dopo il caricamento se l'episodio è disponibile
                                setTimeout(async () => {
                                    try {
                                        const checkResponse = await fetch(`/api/player/tv/${tvId}?season=${season}&episode=${episode}`)
                                        const checkData = await checkResponse.json()
                                        
                                        if (!checkData.success || !checkData.data?.url) {
                                            console.warn('Episodio non disponibile:', { season, episode })
                                            setVideoError('Episodio non disponibile su VixSrc')
                                            toast({
                                                title: "Episodio non disponibile",
                                                description: `L'episodio ${episode} della stagione ${season} non è disponibile su VixSrc`,
                                                variant: "destructive"
                                            })
                                        }
                                    } catch (error) {
                                        console.error('Errore nel controllo disponibilità episodio:', error)
                                    }
                                }, 2000) // Aspetta 2 secondi dopo il caricamento
                            }}
                            onError={() => {
                                setVideoError('Errore nel caricamento del player')
                                toast({
                                    title: "Errore player",
                                    description: "Impossibile caricare il player",
                                    variant: "destructive"
                                })
                            }}
                        />
                    )}
                </div>

                {/* Player Controls */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handlePlayPause}
                                className="text-white hover:bg-white/20"
                            >
                                {isPlaying ? (
                                    <Pause className="w-5 h-5" />
                                ) : (
                                    <Play className="w-5 h-5" />
                                )}
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleMuteToggle}
                                className="text-white hover:bg-white/20"
                            >
                                {isMuted ? (
                                    <VolumeX className="w-5 h-5" />
                                ) : (
                                    <Volume2 className="w-5 h-5" />
                                )}
                            </Button>
                        </div>

                        <div className="flex items-center space-x-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-white hover:bg-white/20"
                            >
                                <Settings className="w-5 h-5" />
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-white hover:bg-white/20"
                            >
                                <Maximize className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                        <div className="w-full bg-white/20 h-1 rounded-full">
                            <div
                                className="bg-red-600 h-1 rounded-full transition-all duration-300"
                                style={{ width: `${(currentTime / duration) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* TV Show Info */}
            <div className="p-8 bg-black">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold mb-4">Informazioni</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Trama</h3>
                            <p className="text-gray-300 leading-relaxed">{tvShow.overview}</p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2">Dettagli</h3>
                            <div className="space-y-2 text-gray-300">
                                <p><span className="font-medium">Prima messa in onda:</span> {tvShow.first_air_date}</p>
                                <p><span className="font-medium">Stagioni:</span> {tvShow.number_of_seasons}</p>
                                <p><span className="font-medium">Episodi:</span> {tvShow.number_of_episodes}</p>
                                <p><span className="font-medium">Valutazione:</span> ⭐ {tvShow.vote_average}/10</p>
                                {tvShow.genres && (
                                    <p>
                                        <span className="font-medium">Generi:</span> {tvShow.genres.map(g => g.name).join(', ')}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
