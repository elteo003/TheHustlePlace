'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, Settings } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { VideoPlayerService } from '@/services/video-player.service'

interface TVShow {
    id: number
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
    const [loading, setLoading] = useState(true)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const videoPlayerService = new VideoPlayerService()

    useEffect(() => {
        fetchTVShowDetails()
    }, [tvId])

    const fetchTVShowDetails = async () => {
        try {
            // Per ora usiamo dati mock, ma in futuro potremmo fare una chiamata API
            const mockTVShow: TVShow = {
                id: parseInt(tvId),
                name: "Breaking Bad",
                overview: "Un insegnante di chimica malato di cancro si trasforma in un produttore di metanfetamine.",
                poster_path: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
                backdrop_path: "/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg",
                first_air_date: "2008-01-20",
                vote_average: 9.5,
                number_of_seasons: 5,
                number_of_episodes: 62,
                genres: [
                    { id: 80, name: "Crime" },
                    { id: 18, name: "Drama" }
                ]
            }

            setTVShow(mockTVShow)
            setLoading(false)
        } catch (error) {
            console.error('Errore nel caricamento della serie TV:', error)
            toast({
                title: "Errore",
                description: "Impossibile caricare i dettagli della serie TV",
                variant: "destructive"
            })
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
                    <iframe
                        src={videoPlayerService.getPlayerUrl(tvShow.id, 'tv', season, episode)}
                        className="w-full h-full border-0"
                        allowFullScreen
                        title={`${tvShow.name} - Stagione ${season}, Episodio ${episode}`}
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
