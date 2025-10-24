'use client'

import { useState, useEffect, useRef } from 'react'
import { Movie, TVShow } from '@/types'
import { getTMDBImageUrl, TMDBMovie } from '@/lib/tmdb'
import { Play } from 'lucide-react'

interface UpcomingTrailersProps {
    movies: (Movie | TVShow | TMDBMovie)[]
    currentMovieIndex: number
    onMovieSelect: (index: number) => void
    isVisible: boolean
    onAutoplay: () => void
    autoplayDelay?: number // secondi prima dell'autoplay
}

export const UpcomingTrailers = ({
    movies,
    currentMovieIndex,
    onMovieSelect,
    isVisible,
    onAutoplay,
    autoplayDelay = 5
}: UpcomingTrailersProps) => {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [autoplayTimer, setAutoplayTimer] = useState<NodeJS.Timeout | null>(null)

    // Calcola i prossimi film (escludendo quello attuale)
    const upcomingMovies = movies.filter((_, index) => index !== currentMovieIndex)

    // Reset timer quando cambia il film selezionato
    useEffect(() => {
        if (autoplayTimer) {
            clearTimeout(autoplayTimer)
            setAutoplayTimer(null)
        }

        if (isVisible && selectedIndex < upcomingMovies.length) {
            const timer = setTimeout(() => {
                onAutoplay()
            }, autoplayDelay * 1000)

            setAutoplayTimer(timer)
        }

        return () => {
            if (autoplayTimer) {
                clearTimeout(autoplayTimer)
            }
        }
    }, [selectedIndex, isVisible, autoplayDelay, onAutoplay])

    // Reset timer quando il componente diventa invisibile
    useEffect(() => {
        if (!isVisible && autoplayTimer) {
            clearTimeout(autoplayTimer)
            setAutoplayTimer(null)
        }
    }, [isVisible, autoplayTimer])

    // Reset selectedIndex quando cambia currentMovieIndex
    useEffect(() => {
        setSelectedIndex(0)
    }, [currentMovieIndex])

    // Reset timer quando cambia currentMovieIndex
    useEffect(() => {
        if (autoplayTimer) {
            clearTimeout(autoplayTimer)
            setAutoplayTimer(null)
        }
    }, [currentMovieIndex, autoplayTimer])

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (autoplayTimer) {
                clearTimeout(autoplayTimer)
            }
        }
    }, [autoplayTimer])


    // Handle movie selection
    const handleMovieSelect = (index: number) => {
        setSelectedIndex(index)
        // Trova l'indice originale nel array completo
        const selectedMovie = upcomingMovies[index]
        const originalIndex = movies.findIndex(movie => movie.id === selectedMovie.id)
        if (originalIndex !== -1) {
            onMovieSelect(originalIndex)
        }
    }


    if (!isVisible || upcomingMovies.length === 0) {
        return null
    }

    return (
        <div className="w-full">
            <div className="flex gap-4 overflow-x-auto scrollbar-horizontal pb-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {upcomingMovies.map((movie, index) => {
                    const isSelected = index === selectedIndex
                    const title = (movie as any).title || (movie as any).name || 'Titolo non disponibile'
                    const backdropPath = (movie as any).backdrop_path || (movie as any).poster_path

                    return (
                        <div
                            key={movie.id}
                            className={`flex-shrink-0 w-64 h-36 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 ${isSelected
                                ? 'ring-2 ring-blue-500 scale-105'
                                : 'hover:scale-105'
                                }`}
                            onClick={() => handleMovieSelect(index)}
                        >
                            <div className="relative w-full h-full group">
                                {/* Backdrop Image */}
                                <img
                                    src={backdropPath ? getTMDBImageUrl(backdropPath, 'w500') : '/placeholder-movie.svg'}
                                    alt={title}
                                    className="w-full h-full object-cover"
                                />

                                {/* Overlay */}
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300" />

                                {/* Play Button */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="p-3 rounded-full bg-black/60 backdrop-blur-sm border border-white/30 group-hover:bg-black/80 transition-all duration-300">
                                        <Play className="w-6 h-6 text-white fill-white" />
                                    </div>
                                </div>

                                {/* Title */}
                                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                                    <h4 className="text-white text-sm font-semibold truncate">
                                        {title}
                                    </h4>
                                </div>

                                {/* Selected Indicator */}
                                {isSelected && (
                                    <div className="absolute top-2 right-2">
                                        <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Autoplay Countdown */}
            {selectedIndex < upcomingMovies.length && (
                <div className="mt-4 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-gray-300 text-sm">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span>
                            Prossimo film tra {autoplayDelay} secondi...
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}
