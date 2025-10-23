'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, Settings } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { VideoPlayerService, VideoSource } from '@/services/video-player.service'
import { ErrorBoundary } from '@/components/error-boundary'

interface Movie {
    id: number
    tmdb_id?: number
    title: string
    overview: string
    poster_path: string
    backdrop_path: string
    release_date: string
    vote_average: number
    runtime?: number
    genres?: Array<{ id: number; name: string }>
}

export default function MoviePlayerPage() {
    const params = useParams()
    const router = useRouter()
    const movieId = params.id as string
    const videoRef = useRef<HTMLVideoElement>(null)
    const videoPlayerService = new VideoPlayerService()

    const [movie, setMovie] = useState<Movie | null>(null)
    const [videoSource, setVideoSource] = useState<VideoSource | null>(null)
    const [loading, setLoading] = useState(true)
    const [videoLoading, setVideoLoading] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [useEmbed, setUseEmbed] = useState(false)
    const [iframeError, setIframeError] = useState(false)
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)
    const [iframeLoaded, setIframeLoaded] = useState(false)

    useEffect(() => {
        fetchMovieDetails()
    }, [movieId])

    useEffect(() => {
        if (movie) {
            loadVideoSource()
        }
    }, [movie])

    // Cleanup timeout quando il componente viene smontato
    useEffect(() => {
        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId)
                console.log('🧹 Timeout pulito al dismount')
            }
        }
    }, [timeoutId])

    // Timeout per rilevare se l'iframe non si carica (aumentato a 30 secondi)
    useEffect(() => {
        if (useEmbed && !iframeError && !iframeLoaded) {
            const timeout = setTimeout(() => {
                console.log('⏰ Timeout: iframe non caricato entro 30 secondi')
                setIframeError(true)
                toast({
                    title: "Timeout",
                    description: "Il player non si è caricato in tempo",
                    variant: "destructive"
                })
            }, 30000) // 30 secondi per dare più tempo a vixsrc.to

            // Salva il timeout ID per poterlo cancellare
            setTimeoutId(timeout)

            return () => clearTimeout(timeout)
        }
    }, [useEmbed, iframeError, iframeLoaded])

    const fetchMovieDetails = async () => {
        try {
            // Reset degli stati quando si carica un nuovo film
            setIframeLoaded(false)
            setIframeError(false)
            setUseEmbed(false)
            if (timeoutId) {
                clearTimeout(timeoutId)
                setTimeoutId(null)
            }

            console.log('🔍 Recupero dettagli film per ID:', movieId)

            // Usa direttamente l'API TMDB per ottenere i dettagli del film
            const response = await fetch(`/api/tmdb/movies/${movieId}`)

            if (!response.ok) {
                throw new Error('Errore nel recupero film da TMDB')
            }

            const data = await response.json()
            console.log('📊 Dati film TMDB:', data)

            if (data.success && data.data) {
                const tmdbMovie = data.data
                console.log('✅ Film trovato su TMDB:', tmdbMovie.title)

                // Converti i dati TMDB nel formato del player
                const movieData: Movie = {
                    id: tmdbMovie.id,
                    tmdb_id: tmdbMovie.id,
                    title: tmdbMovie.title,
                    overview: tmdbMovie.overview,
                    poster_path: tmdbMovie.poster_path,
                    backdrop_path: tmdbMovie.backdrop_path,
                    release_date: tmdbMovie.release_date,
                    vote_average: tmdbMovie.vote_average,
                    runtime: tmdbMovie.runtime || 0,
                    genres: tmdbMovie.genres || []
                }

                setMovie(movieData)
                console.log('✅ Film configurato:', movieData.title, 'TMDB ID:', movieData.tmdb_id)
            } else {
                console.log('❌ Film non trovato su TMDB, uso fallback con TMDB ID:', movieId)

                // Fallback: usa dati minimi se il film non è trovato
                const fallbackMovie: Movie = {
                    id: parseInt(movieId),
                    tmdb_id: parseInt(movieId),
                    title: `Film ${movieId}`,
                    overview: `Film disponibile su vixsrc.to con TMDB ID ${movieId}. Se il film non si carica, potrebbe non essere disponibile su VixSrc.`,
                    poster_path: "/placeholder-movie.svg",
                    backdrop_path: "/placeholder-movie.svg",
                    release_date: "",
                    vote_average: 0,
                    runtime: 0,
                    genres: []
                }
                setMovie(fallbackMovie)
            }

            setLoading(false)
        } catch (error) {
            console.error('❌ Errore nel caricamento del film:', error)

            // Fallback: usa dati minimi in caso di errore
            const fallbackMovie: Movie = {
                id: parseInt(movieId),
                tmdb_id: parseInt(movieId),
                title: `Film ${movieId}`,
                overview: `Film disponibile su vixsrc.to con TMDB ID ${movieId}. Se il film non si carica, potrebbe non essere disponibile su VixSrc.`,
                poster_path: "/placeholder-movie.svg",
                backdrop_path: "/placeholder-movie.svg",
                release_date: "",
                vote_average: 0,
                runtime: 0,
                genres: []
            }
            setMovie(fallbackMovie)
            setLoading(false)
        }
    }

    const loadVideoSource = async () => {
        if (!movie) return

        try {
            setVideoLoading(true)

            // Usa l'ID TMDB corretto dal film caricato
            const tmdbId = movie.tmdb_id || movie.id
            console.log('🎬 Caricamento video source per film:', movie.title)
            console.log('🆔 TMDB ID utilizzato per vixsrc.to:', tmdbId)
            console.log('🔗 URL che verrà generato:', `https://vixsrc.to/movie/${tmdbId}`)

            // Prima controlla se il film è disponibile su VixSrc (opzionale)
            console.log('🔍 Controllo disponibilità su VixSrc...')
            let isAvailable = true // Assume disponibile di default
            
            try {
                const availabilityResponse = await fetch(`/api/player/check-availability?tmdbId=${tmdbId}&type=movie`)
                const availabilityData = await availabilityResponse.json()

                if (availabilityData.success && availabilityData.data?.isAvailable === false) {
                    console.log('❌ Film non disponibile su VixSrc secondo il controllo')
                    isAvailable = false
                } else {
                    console.log('✅ Film disponibile su VixSrc secondo il controllo')
                    isAvailable = true
                }
            } catch (availabilityError) {
                console.log('⚠️ Errore nel controllo disponibilità, procedo comunque:', availabilityError)
                // Se il controllo fallisce, assumiamo che sia disponibile e procediamo
                isAvailable = true
            }

            // Se il controllo dice che non è disponibile, mostra un warning ma procedi comunque
            if (!isAvailable) {
                console.log('⚠️ Controllo dice non disponibile, ma provo comunque...')
                toast({
                    title: "Controllo disponibilità",
                    description: "Il film potrebbe non essere disponibile, ma provo comunque a caricarlo...",
                    variant: "default"
                })
            }

            // Prova a caricare l'iframe di vixsrc.to
            console.log('✅ Tentativo di caricamento iframe vixsrc.to')
            setUseEmbed(true)
            toast({
                title: "Player caricato",
                description: "Loading vixsrc.to player..."
            })
        } catch (error) {
            console.error('❌ Errore nel caricamento del video:', error)
            setUseEmbed(false)
            setIframeError(true)
            toast({
                title: "Errore video",
                description: "Impossibile caricare il player",
                variant: "destructive"
            })
        } finally {
            setVideoLoading(false)
        }
    }

    const handlePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause()
            } else {
                videoRef.current.play()
            }
        }
        setIsPlaying(!isPlaying)
        toast({
            title: isPlaying ? "Riproduzione in pausa" : "Riproduzione avviata",
            description: `Film: ${movie?.title}`
        })
    }

    const handleMuteToggle = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted
        }
        setIsMuted(!isMuted)
    }

    const handleBack = () => {
        router.back()
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        )
    }

    if (!movie) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white text-xl">Film non trovato</div>
            </div>
        )
    }

    return (
        <ErrorBoundary>
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
                            backgroundImage: `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})`
                        }}
                    />

                    {/* Video Player */}
                    {useEmbed && !iframeError ? (
                        <div className="relative z-10 w-full h-full">
                            <iframe
                                src={videoPlayerService.getPlayerUrl(movie.tmdb_id || parseInt(movieId), 'movie')}
                                className="w-full h-full border-0"
                                allowFullScreen
                                title={movie.title}
                                allow="autoplay; fullscreen; picture-in-picture; encrypted-media; web-share"
                                loading="lazy"
                                onLoad={(e) => {
                                    console.log('✅ Iframe caricato con successo')
                                    console.log('🔗 URL iframe:', videoPlayerService.getPlayerUrl(movie.tmdb_id || parseInt(movieId), 'movie'))

                                    // Cancella il timeout immediatamente quando l'iframe si carica
                                    if (timeoutId) {
                                        clearTimeout(timeoutId)
                                        setTimeoutId(null)
                                        console.log('✅ Timeout cancellato - iframe caricato')
                                    }

                                    // Marca l'iframe come caricato
                                    setIframeLoaded(true)
                                    setIframeError(false)

                                    // Per VixSrc, assumiamo che se l'iframe si carica senza errori, il contenuto è disponibile
                                    // Non possiamo accedere al contentDocument per motivi di cross-origin
                                    console.log('✅ Player VixSrc caricato correttamente')

                                    // Mostra toast di successo dopo un breve delay per evitare spam
                                    setTimeout(() => {
                                        toast({
                                            title: "Player caricato",
                                            description: "Il player di vixsrc.to è pronto"
                                        })
                                    }, 1000)
                                }}
                                onError={(e) => {
                                    console.error('❌ Errore nel caricamento iframe:', e)
                                    console.log('🔗 URL che ha fallito:', videoPlayerService.getPlayerUrl(movie.tmdb_id || parseInt(movieId), 'movie'))

                                    // Cancella il timeout anche in caso di errore
                                    if (timeoutId) {
                                        clearTimeout(timeoutId)
                                        setTimeoutId(null)
                                        console.log('✅ Timeout cancellato - errore iframe')
                                    }

                                    setIframeError(true)
                                    toast({
                                        title: "Errore player",
                                        description: "Impossibile caricare il player",
                                        variant: "destructive"
                                    })
                                }}
                            />
                        </div>
                    ) : iframeError || (!useEmbed && !videoLoading) ? (
                        <div className="relative z-10 flex items-center justify-center h-full">
                            <div className="text-center max-w-2xl mx-auto px-8">
                                <div className="w-32 h-32 bg-red-500/20 rounded-full flex items-center justify-center mb-8 mx-auto backdrop-blur-sm">
                                    <svg className="w-16 h-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                                <h1 className="text-4xl font-bold mb-4 text-white">{movie.title}</h1>
                                <p className="text-xl text-gray-300 mb-6">
                                    Questo film non è attualmente disponibile per lo streaming su vixsrc.to
                                </p>
                                <p className="text-lg text-gray-400 mb-8">
                                    ID Film: {movie.tmdb_id || movie.id}. Potrebbe essere temporaneamente non disponibile o non essere presente nel catalogo di VixSrc.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Button
                                        size="lg"
                                        onClick={() => window.open(`https://vixsrc.to/movie/${movie.tmdb_id || movie.id}`, '_blank')}
                                        className="bg-red-600 hover:bg-red-700 text-white"
                                    >
                                        <Play className="w-5 h-5 mr-2" />
                                        Prova su vixsrc.to
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        onClick={handleBack}
                                        className="border-white/30 text-white hover:bg-white/10"
                                    >
                                        Torna al catalogo
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : videoSource ? (
                        <div className="relative z-10 w-full h-full flex items-center justify-center">
                            <video
                                ref={videoRef}
                                src={videoSource.url}
                                className="w-full h-full object-contain"
                                controls={false}
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                                onError={() => {
                                    toast({
                                        title: "Errore video",
                                        description: "Loading external player...",
                                        variant: "destructive"
                                    })
                                    setUseEmbed(true)
                                }}
                            />
                        </div>
                    ) : videoLoading ? (
                        <div className="relative z-10 flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mb-8 mx-auto backdrop-blur-sm">
                                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
                                </div>
                                <h1 className="text-4xl font-bold mb-4">{movie.title}</h1>
                                <p className="text-xl text-gray-300 mb-6">Loading video...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="relative z-10 flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mb-8 mx-auto backdrop-blur-sm">
                                    <Button
                                        size="lg"
                                        onClick={handlePlayPause}
                                        className="w-20 h-20 rounded-full bg-white/90 hover:bg-white text-black"
                                    >
                                        {isPlaying ? (
                                            <Pause className="w-8 h-8" />
                                        ) : (
                                            <Play className="w-8 h-8 ml-1" />
                                        )}
                                    </Button>
                                </div>

                                <h1 className="text-4xl font-bold mb-4">{movie.title}</h1>
                                <p className="text-xl text-gray-300 mb-6 max-w-2xl mx-auto">
                                    {movie.overview}
                                </p>

                                <div className="flex items-center justify-center space-x-6 text-sm text-gray-400">
                                    <span>{movie.release_date}</span>
                                    <span>•</span>
                                    <span>{movie.runtime} min</span>
                                    <span>•</span>
                                    <span>⭐ {movie.vote_average}/10</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Player Controls - Solo per video nativi, non per iframe */}
                    {!useEmbed && videoSource && (
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
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
                    )}
                </div>

                {/* Movie Info */}
                <div className="p-8 bg-black">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-2xl font-bold mb-4">Informazioni</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Trama</h3>
                                <p className="text-gray-300 leading-relaxed">{movie.overview}</p>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold mb-2">Dettagli</h3>
                                <div className="space-y-2 text-gray-300">
                                    <p><span className="font-medium">Data di uscita:</span> {movie.release_date}</p>
                                    <p><span className="font-medium">Durata:</span> {movie.runtime} minuti</p>
                                    <p><span className="font-medium">Valutazione:</span> ⭐ {movie.vote_average}/10</p>
                                    {movie.genres && (
                                        <p>
                                            <span className="font-medium">Generi:</span> {movie.genres.map(g => g.name).join(', ')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    )
}
