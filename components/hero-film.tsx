'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Play, Star, Clock, Calendar } from 'lucide-react'
import { TMDBMovie } from '@/services/tmdb-movies.service'
import { tmdbWrapperService } from '@/services/tmdb-wrapper.service'

interface HeroFilmProps {
    className?: string
}

export function HeroFilm({ className = '' }: HeroFilmProps) {
    const [featuredMovie, setFeaturedMovie] = useState<TMDBMovie | null>(null)
    const [trailerKey, setTrailerKey] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
        loadFeaturedMovie()
    }, [])

    const loadFeaturedMovie = async () => {
        try {
            setLoading(true)

            // Ottieni il film più popolare tramite API route
            const response = await fetch('/api/tmdb/movies?type=popular')
            if (response.ok) {
                const data = await response.json()
                if (data.success && data.data.length > 0) {
                    const movie = data.data[0]
                    setFeaturedMovie(movie)

                    // Ottieni il trailer
                    const trailer = await tmdbWrapperService.getMainTrailer(movie.id)
                    if (trailer) {
                        setTrailerKey(trailer.key)
                    }
                }
            }
        } catch (error) {
            console.error('Errore nel caricamento film in evidenza:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleWatchNow = () => {
        if (featuredMovie) {
            // Naviga direttamente al player del film
            window.location.href = `/player/movie/${featuredMovie.id}`
        }
    }

    if (!isMounted || loading) {
        return (
            <div className={`relative h-[70vh] bg-gray-900 ${className}`}>
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent z-10"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-pulse">
                        <div className="h-16 bg-gray-700 rounded w-96 mb-4"></div>
                        <div className="h-4 bg-gray-700 rounded w-80 mb-2"></div>
                        <div className="h-4 bg-gray-700 rounded w-64"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (!featuredMovie) {
        return (
            <div className={`relative h-[70vh] bg-gray-900 flex items-center justify-center ${className}`}>
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Nessun film disponibile</h2>
                    <p className="text-gray-400">Riprova più tardi</p>
                </div>
            </div>
        )
    }

    return (
        <div className={`relative h-[70vh] overflow-hidden ${className}`}>
            {/* Background Image */}
            <div className="absolute inset-0">
                <Image
                    src={tmdbWrapperService.getImageUrl(featuredMovie.backdrop_path, 'w1280')}
                    alt={featuredMovie.title}
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
            </div>

            {/* Trailer Overlay */}
            {trailerKey && (
                <div className="absolute inset-0 z-10">
                    <iframe
                        src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&loop=1&playlist=${trailerKey}&controls=0&showinfo=0&rel=0&modestbranding=1`}
                        className="w-full h-full"
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent"></div>
                </div>
            )}

            {/* Content */}
            <div className="relative z-20 h-full flex items-center">
                <div className="container mx-auto px-6">
                    <div className="max-w-2xl">
                        {/* Title */}
                        <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
                            {featuredMovie.title}
                        </h1>

                        {/* Meta Info */}
                        <div className="flex items-center gap-6 mb-4 text-gray-300">
                            <div className="flex items-center gap-1">
                                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                                <span className="font-semibold">
                                    {featuredMovie.vote_average.toFixed(1)}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Calendar className="w-5 h-5" />
                                <span>{new Date(featuredMovie.release_date).getFullYear()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="w-5 h-5" />
                                <span>2h 15m</span>
                            </div>
                        </div>

                        {/* Overview */}
                        <p className="text-lg text-gray-200 mb-8 leading-relaxed">
                            {featuredMovie.overview}
                        </p>

                        {/* Action Buttons */}
                        <div className="flex gap-4">
                            <button
                                onClick={handleWatchNow}
                                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                            >
                                <Play className="w-5 h-5" />
                                Guarda Ora
                            </button>
                            <button className="flex items-center gap-2 bg-gray-600/50 hover:bg-gray-600/70 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                                + Lista
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
