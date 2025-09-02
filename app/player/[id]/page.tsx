'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { VideoPlayer } from '@/components/video-player'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Play, Plus, Heart, Bookmark, Share2 } from 'lucide-react'
import { Movie, TVShow } from '@/types'
import { getImageUrl, formatDate, formatVoteAverage } from '@/lib/utils'

export default function PlayerPage() {
    const params = useParams()
    const router = useRouter()
    const [movie, setMovie] = useState<Movie | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchMovie = async () => {
            try {
                setLoading(true)

                // Per ora usiamo dati mock, in un'app reale dovresti fare una chiamata API
                // per recuperare i dettagli del film/serie TV
                const mockMovie: Movie = {
                    id: parseInt(params.id as string),
                    title: 'Film di Esempio',
                    overview: 'Una descrizione interessante del film che stai per guardare. Questo è un film di esempio per dimostrare le funzionalità del player.',
                    poster_path: '/placeholder-movie.jpg',
                    backdrop_path: '/placeholder-backdrop.jpg',
                    release_date: '2024-01-01',
                    vote_average: 8.5,
                    vote_count: 1250,
                    genre_ids: [28, 12, 878],
                    adult: false,
                    original_language: 'en',
                    original_title: 'Example Movie',
                    popularity: 85.5,
                    video: false
                }

                setMovie(mockMovie)
            } catch (error) {
                setError('Errore nel caricamento del film')
            } finally {
                setLoading(false)
            }
        }

        if (params.id) {
            fetchMovie()
        }
    }, [params.id])

    const handlePlay = () => {
        console.log('Video avviato')
    }

    const handlePause = () => {
        console.log('Video in pausa')
    }

    const handleSeeked = (time: number) => {
        console.log('Seek a:', time)
    }

    const handleEnded = () => {
        console.log('Video terminato')
    }

    const handleTimeUpdate = (time: number) => {
        console.log('Tempo aggiornato:', time)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-lg">Loading...</p>
                </div>
            </div>
        )
    }

    if (error || !movie) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <p className="text-white text-lg mb-4">Errore nel caricamento del contenuto</p>
                    <Button onClick={() => router.back()} className="premium-button">
                        Torna indietro
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black">
            <Navbar />

            <div className="pt-16">
                {/* Back Button */}
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="text-white hover:bg-white/10 flex items-center space-x-2"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Torna indietro</span>
                    </Button>
                </div>

                {/* Player Section */}
                <div className="max-w-7xl mx-auto px-4 pb-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Video Player */}
                        <div className="lg:col-span-2">
                            <VideoPlayer
                                tmdbId={movie.id}
                                type="movie"
                                primaryColor="#3b82f6"
                                secondaryColor="#8b5cf6"
                                autoplay={true}
                                onPlay={handlePlay}
                                onPause={handlePause}
                                onSeeked={handleSeeked}
                                onEnded={handleEnded}
                                onTimeUpdate={handleTimeUpdate}
                            />
                        </div>

                        {/* Movie Info */}
                        <div className="space-y-6">
                            <Card className="bg-black/50 border-white/20 backdrop-blur-md">
                                <CardContent className="p-6">
                                    <h1 className="text-2xl font-bold text-white mb-4">{movie.title}</h1>

                                    <div className="flex items-center space-x-4 mb-4">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-yellow-400">★</span>
                                            <span className="text-white font-medium">
                                                {formatVoteAverage(movie.vote_average)}
                                            </span>
                                        </div>
                                        <span className="text-gray-400">
                                            {formatDate(movie.release_date)}
                                        </span>
                                    </div>

                                    <p className="text-gray-300 mb-6 leading-relaxed">
                                        {movie.overview}
                                    </p>

                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-2">
                                            <Button className="flex-1 premium-button">
                                                <Play className="w-4 h-4 mr-2" />
                                                Guarda ora
                                            </Button>
                                            <Button variant="outline" size="icon" className="border-white/30 text-white hover:bg-white/10">
                                                <Plus className="w-5 h-5" />
                                            </Button>
                                            <Button variant="outline" size="icon" className="border-white/30 text-white hover:bg-white/10">
                                                <Heart className="w-5 h-5" />
                                            </Button>
                                            <Button variant="outline" size="icon" className="border-white/30 text-white hover:bg-white/10">
                                                <Bookmark className="w-5 h-5" />
                                            </Button>
                                        </div>

                                        <Button variant="outline" className="w-full border-white/30 text-white hover:bg-white/10">
                                            <Share2 className="w-4 h-4 mr-2" />
                                            Condividi
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Additional Info */}
                            <Card className="bg-black/50 border-white/20 backdrop-blur-md">
                                <CardContent className="p-6">
                                    <h3 className="text-lg font-semibold text-white mb-4">Informazioni</h3>

                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Genere:</span>
                                            <span className="text-white">Azione, Avventura, Fantascienza</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Durata:</span>
                                            <span className="text-white">2h 15m</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Lingua:</span>
                                            <span className="text-white">Italiano, Inglese</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Qualità:</span>
                                            <span className="text-white">4K Ultra HD</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
