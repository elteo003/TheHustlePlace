'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, Settings } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { VideoPlayerService, VideoSource } from '@/services/video-player.service'

interface Movie {
    id: number
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

    useEffect(() => {
        fetchMovieDetails()
    }, [movieId])

    useEffect(() => {
        if (movie) {
            loadVideoSource()
        }
    }, [movie])

    const fetchMovieDetails = async () => {
        try {
            // Per ora usiamo dati mock, ma in futuro potremmo fare una chiamata API
            const mockMovie: Movie = {
                id: parseInt(movieId),
                title: "Inception",
                overview: "Un ladro esperto che ruba segreti dal subconscio durante lo stato di sogno.",
                poster_path: "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
                backdrop_path: "/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
                release_date: "2010-07-16",
                vote_average: 8.4,
                runtime: 148,
                genres: [
                    { id: 28, name: "Azione" },
                    { id: 878, name: "Fantascienza" },
                    { id: 53, name: "Thriller" }
                ]
            }

            setMovie(mockMovie)
            setLoading(false)
        } catch (error) {
            console.error('Errore nel caricamento del film:', error)
            toast({
                title: "Errore",
                description: "Impossibile caricare i dettagli del film",
                variant: "destructive"
            })
            setLoading(false)
        }
    }

    const loadVideoSource = async () => {
        if (!movie) return

        try {
            setVideoLoading(true)

            // Usa sempre l'iframe embed di vixsrc.to per la riproduzione
            // Questo è più affidabile delle API di estrazione video
            setUseEmbed(true)
            toast({
                title: "Player caricato",
                description: "Loading vixsrc.to player..."
            })
        } catch (error) {
            console.error('Errore nel caricamento del video:', error)
            setUseEmbed(true)
            toast({
                title: "Errore video",
                description: "Loading external player...",
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
                {useEmbed ? (
                    <div className="relative z-10 w-full h-full">
                        <iframe
                            src={videoPlayerService.getPlayerUrl(movie.id, 'movie')}
                            className="w-full h-full border-0"
                            allowFullScreen
                            title={movie.title}
                            allow="autoplay; fullscreen; picture-in-picture; encrypted-media; web-share"
                            loading="lazy"
                            onLoad={() => {
                                toast({
                                    title: "Player caricato",
                                    description: "Il player di vixsrc.to è pronto"
                                })
                            }}
                            onError={() => {
                                toast({
                                    title: "Errore player",
                                    description: "Impossibile caricare il player",
                                    variant: "destructive"
                                })
                            }}
                        />
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

                {/* Player Controls */}
                {!useEmbed && (
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
