'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, Settings } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { VideoPlayerService, VideoSource } from '@/services/video-player.service'

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

    useEffect(() => {
        fetchMovieDetails()
    }, [movieId])

    useEffect(() => {
        if (movie) {
            loadVideoSource()
        }
    }, [movie])

    // Timeout per rilevare se l'iframe non si carica (aumentato a 30 secondi)
    useEffect(() => {
        if (useEmbed && !iframeError) {
            const timeout = setTimeout(() => {
                console.log('⏰ Timeout: iframe non caricato entro 30 secondi')
                setIframeError(true)
                toast({
                    title: "Timeout",
                    description: "Il player non si è caricato in tempo",
                    variant: "destructive"
                })
            }, 30000) // 30 secondi per dare più tempo a vixsrc.to

            return () => clearTimeout(timeout)
        }
    }, [useEmbed, iframeError])

    const fetchMovieDetails = async () => {
        try {
            console.log('🔍 Recupero dettagli film per ID:', movieId)

            // Ora l'ID nell'URL è già il tmdb_id, quindi cerchiamo per tmdb_id
            const response = await fetch(`/api/catalog/popular/movies`)
            if (!response.ok) {
                throw new Error('Errore nel recupero del catalogo')
            }

            const catalogData = await response.json()
            if (!catalogData.success) {
                throw new Error('Errore nel catalogo')
            }

            console.log('📊 Catalogo popolari recuperato:', catalogData.data)
            console.log('📊 Tipo di dati:', typeof catalogData.data)
            console.log('📊 È un array?', Array.isArray(catalogData.data))

            // I film popolari sono già un array
            const moviesArray = catalogData.data
            console.log('📊 Array film popolari:', moviesArray.length, 'film')

            // Cerca il film con il tmdb_id specificato (ora l'ID nell'URL è il tmdb_id)
            const foundMovie = moviesArray.find((movie: any) =>
                movie.tmdb_id === parseInt(movieId) || movie.id === parseInt(movieId)
            )

            if (foundMovie) {
                console.log('✅ Film trovato nei popolari:', foundMovie.title, 'TMDB ID:', foundMovie.tmdb_id)
                setMovie(foundMovie)
            } else {
                console.log('❌ Film non trovato nei popolari, provo con i film recenti...')

                // Prova con i film recenti
                try {
                    const recentResponse = await fetch(`/api/catalog/recent`)
                    if (recentResponse.ok) {
                        const recentData = await recentResponse.json()
                        if (recentData.success) {
                            const recentMovies = recentData.data
                            const foundInRecent = recentMovies.find((movie: any) =>
                                movie.tmdb_id === parseInt(movieId) || movie.id === parseInt(movieId)
                            )

                            if (foundInRecent) {
                                console.log('✅ Film trovato nei recenti:', foundInRecent.title, 'TMDB ID:', foundInRecent.tmdb_id)
                                setMovie(foundInRecent)
                            } else {
                                console.log('❌ Film non trovato neanche nei recenti, uso fallback con TMDB ID:', movieId)
                                // Fallback: usa dati minimi se il film non è trovato nel catalogo
                                const fallbackMovie: Movie = {
                                    id: parseInt(movieId),
                                    tmdb_id: parseInt(movieId), // L'ID nell'URL è già il tmdb_id
                                    title: `Film ${movieId}`,
                                    overview: `Film disponibile su vixsrc.to con TMDB ID ${movieId}`,
                                    poster_path: "/placeholder-movie.svg",
                                    backdrop_path: "/placeholder-movie.svg",
                                    release_date: "",
                                    vote_average: 0,
                                    runtime: 0,
                                    genres: []
                                }
                                setMovie(fallbackMovie)
                            }
                        }
                    }
                } catch (recentError) {
                    console.log('❌ Errore nel recupero film recenti, uso fallback con TMDB ID:', movieId)
                    // Fallback: usa dati minimi se il film non è trovato nel catalogo
                    const fallbackMovie: Movie = {
                        id: parseInt(movieId),
                        tmdb_id: parseInt(movieId), // L'ID nell'URL è già il tmdb_id
                        title: `Film ${movieId}`,
                        overview: `Film disponibile su vixsrc.to con TMDB ID ${movieId}`,
                        poster_path: "/placeholder-movie.svg",
                        backdrop_path: "/placeholder-movie.svg",
                        release_date: "",
                        vote_average: 0,
                        runtime: 0,
                        genres: []
                    }
                    setMovie(fallbackMovie)
                }
            }

            setLoading(false)
        } catch (error) {
            console.error('❌ Errore nel caricamento del film:', error)

            // Fallback: usa dati minimi in caso di errore
            const fallbackMovie: Movie = {
                id: parseInt(movieId),
                tmdb_id: parseInt(movieId), // L'ID nell'URL è già il tmdb_id
                title: `Film ${movieId}`,
                overview: `Film disponibile su vixsrc.to con TMDB ID ${movieId}`,
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

            // Ora l'ID nell'URL è già il tmdb_id, quindi lo usiamo direttamente
            const tmdbId = parseInt(movieId)
            console.log('🎬 Caricamento video source per film:', movie.title)
            console.log('🆔 TMDB ID utilizzato per vixsrc.to:', tmdbId)
            console.log('🔗 URL che verrà generato:', `https://vixsrc.to/movie/${tmdbId}`)

            // Prima controlla se il film è disponibile su VixSrc
            console.log('🔍 Controllo disponibilità su VixSrc...')
            try {
                const availabilityResponse = await fetch(`/api/player/check-availability?tmdbId=${tmdbId}&type=movie`)
                const availabilityData = await availabilityResponse.json()

                if (!availabilityData.success || !availabilityData.available) {
                    console.log('❌ Film non disponibile su VixSrc')
                    setIframeError(true)
                    setUseEmbed(false)
                    toast({
                        title: "Film non disponibile",
                        description: "Questo film non è disponibile su VixSrc",
                        variant: "destructive"
                    })
                    return
                }

                console.log('✅ Film disponibile su VixSrc, caricamento iframe...')
            } catch (availabilityError) {
                console.log('⚠️ Errore nel controllo disponibilità, procedo comunque:', availabilityError)
                // Se il controllo fallisce, procediamo comunque
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
                            src={videoPlayerService.getPlayerUrl(parseInt(movieId), 'movie')}
                            className="w-full h-full border-0"
                            allowFullScreen
                            title={movie.title}
                            allow="autoplay; fullscreen; picture-in-picture; encrypted-media; web-share"
                            loading="lazy"
                            onLoad={(e) => {
                                console.log('✅ Iframe caricato con successo')
                                console.log('🔗 URL iframe:', videoPlayerService.getPlayerUrl(parseInt(movieId), 'movie'))
                                console.log('📊 Iframe event:', e)

                                // Verifica se l'iframe contiene effettivamente il player
                                // Aspetta un po' per permettere al contenuto di caricarsi
                                setTimeout(() => {
                                    try {
                                        const iframe = e.target as HTMLIFrameElement
                                        if (iframe && iframe.contentDocument) {
                                            // Se riusciamo ad accedere al contenuto, probabilmente è un errore 404
                                            console.log('⚠️ Possibile errore 404 - iframe accessibile')
                                            setIframeError(true)
                                            toast({
                                                title: "Film non disponibile",
                                                description: "Il film non è disponibile su VixSrc",
                                                variant: "destructive"
                                            })
                                        } else {
                                            // Se non riusciamo ad accedere, probabilmente è il player VixSrc
                                            console.log('✅ Player VixSrc caricato correttamente')
                                            setIframeError(false)
                                            if (timeoutId) {
                                                clearTimeout(timeoutId)
                                                setTimeoutId(null)
                                            }
                                            toast({
                                                title: "Player caricato",
                                                description: "Il player di vixsrc.to è pronto"
                                            })
                                        }
                                    } catch (error) {
                                        // Se c'è un errore di accesso, probabilmente è il player VixSrc (cross-origin)
                                        console.log('✅ Player VixSrc caricato (cross-origin)')
                                        setIframeError(false)
                                        if (timeoutId) {
                                            clearTimeout(timeoutId)
                                            setTimeoutId(null)
                                        }
                                        toast({
                                            title: "Player caricato",
                                            description: "Il player di vixsrc.to è pronto"
                                        })
                                    }
                                }, 2000) // Aspetta 2 secondi per permettere il caricamento
                            }}
                            onError={() => {
                                console.log('❌ Errore nel caricamento iframe')
                                console.log('🔗 URL che ha fallito:', videoPlayerService.getPlayerUrl(parseInt(movieId), 'movie'))
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
                                Potrebbe essere temporaneamente non disponibile o non essere presente nel catalogo.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button
                                    size="lg"
                                    onClick={() => window.open(`https://vixsrc.to/movie/${movieId}`, '_blank')}
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
    )
}
