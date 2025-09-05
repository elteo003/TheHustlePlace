'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Info, Plus, Heart, Volume2, VolumeX } from 'lucide-react'
import { TMDBMovie, getTrendingMoviesDay, getMovieVideos, findMainTrailer, getTMDBImageUrl, getYouTubeEmbedUrl } from '@/lib/tmdb'

export function HeroSection() {
    const [featuredMovie, setFeaturedMovie] = useState<TMDBMovie | null>(null)
    const [trailer, setTrailer] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isHovered, setIsHovered] = useState(false)
    const [isMuted, setIsMuted] = useState(true)
    const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)

    useEffect(() => {
        loadFeaturedMovie()
    }, [])

    useEffect(() => {
        return () => {
            if (hoverTimeout) {
                clearTimeout(hoverTimeout)
            }
        }
    }, [hoverTimeout])

    const loadFeaturedMovie = async () => {
        try {
            setLoading(true)
            setError(null)

            // Recupera film trending del giorno
            const trendingResponse = await getTrendingMoviesDay()
            const movies = trendingResponse.results

            if (movies.length === 0) {
                throw new Error('Nessun film trending trovato')
            }

            // Seleziona un film random
            const randomIndex = Math.floor(Math.random() * movies.length)
            const selectedMovie = movies[randomIndex]
            setFeaturedMovie(selectedMovie)

            // Recupera il trailer
            try {
                const videosResponse = await getMovieVideos(selectedMovie.id)
                const mainTrailer = findMainTrailer(videosResponse.results)

                if (mainTrailer) {
                    setTrailer(mainTrailer.key)
                }
            } catch (trailerError) {
                console.warn('Trailer non trovato:', trailerError)
                // Continua senza trailer
            }

        } catch (err) {
            console.error('Errore nel caricamento film hero:', err)
            setError('Errore nel caricamento del film in evidenza')
        } finally {
            setLoading(false)
        }
    }

    const handleWatchNow = () => {
        if (featuredMovie) {
            window.location.href = `/player/movie/${featuredMovie.id}`
        }
    }

    const handleMoreInfo = () => {
        // Implementa modal con dettagli del film
        console.log('More info per:', featuredMovie?.title)
    }

    const handleMouseEnter = () => {
        if (hoverTimeout) {
            clearTimeout(hoverTimeout)
            setHoverTimeout(null)
        }
        setIsHovered(true)
    }

    const handleMouseLeave = () => {
        const timeout = setTimeout(() => {
            setIsHovered(false)
        }, 100) // Piccolo delay per evitare flickering
        setHoverTimeout(timeout)
    }

    if (loading) {
        return (
            <div className="relative h-screen bg-black">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
                </div>
            </div>
        )
    }

    if (error || !featuredMovie) {
        return (
            <div className="relative h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Errore nel caricamento</h2>
                    <p className="text-gray-400 mb-4">{error || 'Film non trovato'}</p>
                    <Button onClick={loadFeaturedMovie} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                        Riprova
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="relative h-screen overflow-hidden">
            {/* Background Video/Image */}
            <div className="absolute inset-0">
                {trailer ? (
                    <iframe
                        src={getYouTubeEmbedUrl(trailer, true, isMuted)}
                        className="w-full h-full object-cover transition-all duration-500"
                        allow="autoplay; encrypted-media; fullscreen"
                        allowFullScreen
                        style={{
                            transform: 'scale(1.1)',
                            filter: isHovered ? 'brightness(0.9)' : 'brightness(0.5)'
                        }}
                    />
                ) : (
                    <div
                        className="w-full h-full bg-cover bg-center transition-all duration-500"
                        style={{
                            backgroundImage: `url(${getTMDBImageUrl(featuredMovie.backdrop_path, 'original')})`,
                            filter: isHovered ? 'brightness(0.8)' : 'brightness(0.4)'
                        }}
                    />
                )}
            </div>

            {/* Overlay Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-20'}`} />

            {/* Content */}
            <div className={`relative z-10 h-full flex items-center transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="container mx-auto px-4">
                    <div
                        className="max-w-2xl"
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        {/* Title */}
                        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                            {featuredMovie.title}
                        </h1>

                        {/* Overview */}
                        <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed line-clamp-3">
                            {featuredMovie.overview}
                        </p>

                        {/* Rating */}
                        <div className="flex items-center mb-8">
                            <div className="flex items-center">
                                <div className="text-yellow-400 text-2xl mr-2">★</div>
                                <span className="text-white text-xl font-semibold">
                                    {featuredMovie.vote_average.toFixed(1)}
                                </span>
                                <span className="text-gray-400 ml-2">
                                    ({featuredMovie.vote_count.toLocaleString()} voti)
                                </span>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button
                                onClick={handleWatchNow}
                                size="lg"
                                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-8 py-4 text-lg rounded-lg flex items-center gap-3 shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                                <Play className="w-6 h-6" />
                                Guarda Ora
                            </Button>

                            <Button
                                onClick={handleMoreInfo}
                                variant="outline"
                                size="lg"
                                className="border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-4 text-lg rounded-lg flex items-center gap-3 backdrop-blur-sm"
                            >
                                <Info className="w-6 h-6" />
                                Altre Info
                            </Button>

                            {/* Mute/Unmute Button */}
                            {trailer && (
                                <Button
                                    onClick={() => setIsMuted(!isMuted)}
                                    variant="ghost"
                                    size="lg"
                                    className="text-white hover:bg-white/10 font-semibold px-8 py-4 text-lg rounded-lg flex items-center gap-3 backdrop-blur-sm"
                                >
                                    {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                                    {isMuted ? 'Attiva Audio' : 'Disattiva Audio'}
                                </Button>
                            )}

                            <Button
                                variant="ghost"
                                size="lg"
                                className="text-white hover:bg-white/10 font-semibold px-8 py-4 text-lg rounded-lg flex items-center gap-3 backdrop-blur-sm"
                            >
                                <Plus className="w-6 h-6" />
                            </Button>

                            <Button
                                variant="ghost"
                                size="lg"
                                className="text-white hover:bg-white/10 font-semibold px-8 py-4 text-lg rounded-lg flex items-center gap-3 backdrop-blur-sm"
                            >
                                <Heart className="w-6 h-6" />
                            </Button>
                        </div>

                        {/* Release Date */}
                        {featuredMovie.release_date && (
                            <div className="mt-6">
                                <span className="text-gray-300 text-lg">
                                    Uscito il {new Date(featuredMovie.release_date).toLocaleDateString('it-IT')}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Gradient */}
            <div className={`absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-20'}`} />
        </div>
    )
}