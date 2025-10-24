'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { TMDBMovie } from '@/lib/tmdb'
import { useSmartHover } from '@/hooks/useSmartHover'
import { useCleanup } from '@/hooks/useCleanup'

interface UpcomingTrailersSectionProps {
    movies: TMDBMovie[]
    currentMovieIndex: number
    onMovieSelect: (index: number) => void
}

export function UpcomingTrailersSection({ movies, currentMovieIndex, onMovieSelect }: UpcomingTrailersSectionProps) {
    const [countdown, setCountdown] = useState(10)
    const [isAutoPlaying, setIsAutoPlaying] = useState(false)
    const [isInitialized, setIsInitialized] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const countdownRef = useRef<NodeJS.Timeout | null>(null)

    // Hooks personalizzati
    const { addTimeout } = useCleanup()
    const { isHovered, handleMouseEnter, handleMouseLeave } = useSmartHover({
        onEnter: () => setIsAutoPlaying(false),
        onLeave: () => setIsAutoPlaying(true)
    })

    // Filtra i film escludendo quello attuale e mantieni gli indici originali
    const upcomingMovies = movies
        .map((movie, index) => ({ movie, originalIndex: index }))
        .filter(({ originalIndex }) => originalIndex !== currentMovieIndex)
        .slice(0, 6)

    // Funzione stabile per selezionare film
    const handleMovieSelect = useCallback((originalIndex: number) => {
        console.log('🎬 Film selezionato:', originalIndex, 'Titolo:', movies[originalIndex]?.title)
        onMovieSelect(originalIndex)
        setIsAutoPlaying(false)
        setCountdown(10)

        // Riavvia autoplay dopo 3 secondi
        addTimeout(setTimeout(() => {
            setIsAutoPlaying(true)
        }, 3000))
    }, [onMovieSelect, addTimeout, movies])

    // Countdown logic migliorata
    useEffect(() => {
        if (isAutoPlaying && countdown > 0) {
            countdownRef.current = addTimeout(setTimeout(() => {
                setCountdown(prev => prev - 1)
            }, 1000))
        } else if (countdown === 0 && isAutoPlaying) {
            // Autoplay del prossimo film
            const nextIndex = (currentMovieIndex + 1) % movies.length
            handleMovieSelect(nextIndex)
        }

        return () => {
            if (countdownRef.current) {
                clearTimeout(countdownRef.current)
            }
        }
    }, [countdown, isAutoPlaying, currentMovieIndex, movies.length, handleMovieSelect, addTimeout])

    // Inizializzazione countdown
    useEffect(() => {
        if (!isInitialized) {
            const initTimer = addTimeout(setTimeout(() => {
                setIsAutoPlaying(true)
                setIsInitialized(true)
            }, 2000))

            return () => clearTimeout(initTimer)
        }
    }, [isInitialized, addTimeout])

    // Debug per vedere i film disponibili
    console.log('🎬 UpcomingTrailersSection - Film disponibili:', upcomingMovies.length, 'Movies totali:', movies.length)

    return (
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent">
            <div className="container mx-auto">
                {/* Countdown */}
                <div className="flex items-center justify-center mb-4">
                    <div className="flex items-center gap-2 text-white">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">
                            Prossimo film tra: <span className="text-blue-400 font-bold">{countdown}s</span>
                        </span>
                    </div>
                </div>

                {/* Movies Grid */}
                <div
                    ref={containerRef}
                    className="flex gap-4 overflow-x-auto scrollbar-horizontal"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {upcomingMovies.map(({ movie, originalIndex }, index) => {
                        const title = movie.title || 'Titolo non disponibile'
                        const backdropPath = movie.backdrop_path || movie.poster_path

                        return (
                            <div
                                key={movie.id}
                                className={`flex-shrink-0 rounded-lg overflow-hidden cursor-pointer transition-all duration-500 ease-out ${isHovered
                                    ? 'w-64 h-36 scale-110 z-10'
                                    : 'w-48 h-28 hover:scale-105'
                                    }`}
                                onClick={() => {
                                    console.log('🖱️ Click su film:', originalIndex, movie.title)
                                    handleMovieSelect(originalIndex)
                                }}
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                                style={{
                                    transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                                    zIndex: isHovered ? 10 : 1,
                                    border: '2px solid red', // Debug: bordo rosso per vedere i clickable areas
                                }}
                            >
                                <div className="relative w-full h-full group">
                                    {/* Backdrop Image */}
                                    <img
                                        src={backdropPath ? `https://image.tmdb.org/t/p/w500${backdropPath}` : '/placeholder-movie.svg'}
                                        alt={title}
                                        className="w-full h-full object-cover transition-all duration-500"
                                    />

                                    {/* Overlay */}
                                    <div className={`absolute inset-0 transition-all duration-300 ${isHovered ? 'bg-black/20' : 'bg-black/40 group-hover:bg-black/20'
                                        }`} />

                                    {/* Play Button */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className={`p-3 rounded-full backdrop-blur-sm border border-white/30 transition-all duration-300 ${isHovered
                                            ? 'bg-black/80 scale-110'
                                            : 'bg-black/60 group-hover:bg-black/80'
                                            }`}>
                                            <svg className={`text-white fill-white transition-all duration-300 ${isHovered ? 'w-6 h-6' : 'w-4 h-4'
                                                }`} viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                                        <h4 className={`text-white font-semibold truncate transition-all duration-300 ${isHovered ? 'text-sm' : 'text-xs'
                                            }`}>
                                            {title}
                                        </h4>
                                        {isHovered && (
                                            <p className="text-gray-300 text-xs mt-1 line-clamp-2">
                                                {movie.overview || 'Descrizione non disponibile'}
                                            </p>
                                        )}
                                    </div>

                                    {/* Hover Indicator */}
                                    {isHovered && (
                                        <div className="absolute top-2 right-2 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
