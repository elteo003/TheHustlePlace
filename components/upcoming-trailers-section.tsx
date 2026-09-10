'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { TMDBMovie } from '@/lib/tmdb'
import { useSmartHover } from '@/hooks/useSmartHover'
import { useCleanup } from '@/hooks/useCleanup'
import { cn } from '@/lib/utils'

interface UpcomingTrailersSectionProps {
    movies: TMDBMovie[]
    currentMovieIndex: number
    onMovieSelect: (index: number) => void
    compact?: boolean
}

export function UpcomingTrailersSection({ movies, currentMovieIndex, onMovieSelect, compact = false }: UpcomingTrailersSectionProps) {
    const [countdown, setCountdown] = useState(10)
    const [isAutoPlaying, setIsAutoPlaying] = useState(false)
    const [isInitialized, setIsInitialized] = useState(false)
    const [hoveredMovieId, setHoveredMovieId] = useState<number | null>(null)
    const countdownRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const { addTimeout } = useCleanup()
    const { handleMouseEnter: sectionMouseEnter, handleMouseLeave: sectionMouseLeave } = useSmartHover({
        onEnter: () => setIsAutoPlaying(false),
        onLeave: () => setIsAutoPlaying(true)
    })

    const handleMovieMouseEnter = (movieId: number) => {
        setHoveredMovieId(movieId)
        setIsAutoPlaying(false)
    }

    const handleMovieMouseLeave = () => {
        setHoveredMovieId(null)
        setIsAutoPlaying(true)
    }

    const upcomingMovies = movies
        .map((movie, index) => ({ movie, originalIndex: index }))
        .filter(({ originalIndex }) => originalIndex !== currentMovieIndex)
        .slice(0, 6)

    const handleMovieSelect = useCallback((originalIndex: number) => {
        if (typeof onMovieSelect === 'function') {
            onMovieSelect(originalIndex)
        }

        setIsAutoPlaying(false)
        setCountdown(10)

        addTimeout(setTimeout(() => {
            setIsAutoPlaying(true)
        }, 3000))
    }, [onMovieSelect, addTimeout])

    useEffect(() => {
        if (isAutoPlaying && countdown > 0) {
            countdownRef.current = addTimeout(setTimeout(() => {
                setCountdown(prev => prev - 1)
            }, 1000))
        } else if (countdown === 0 && isAutoPlaying) {
            const nextIndex = (currentMovieIndex + 1) % movies.length
            handleMovieSelect(nextIndex)
        }

        return () => {
            if (countdownRef.current) {
                clearTimeout(countdownRef.current)
            }
        }
    }, [countdown, isAutoPlaying, currentMovieIndex, movies.length, handleMovieSelect, addTimeout])

    useEffect(() => {
        if (!isInitialized) {
            const initTimer = addTimeout(setTimeout(() => {
                setIsAutoPlaying(true)
                setIsInitialized(true)
            }, 2000))

            return () => clearTimeout(initTimer)
        }
    }, [isInitialized, addTimeout])

    return (
        <div
            className={cn(
                'absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black via-black/90 to-transparent',
                compact
                    ? 'pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]'
                    : 'pt-8 pb-[max(1.25rem,env(safe-area-inset-bottom))]'
            )}
            onMouseEnter={sectionMouseEnter}
            onMouseLeave={sectionMouseLeave}
        >
            <div className={cn('content-gutter flex items-center', compact ? 'mb-2' : 'mb-4')}>
                <div className={cn('flex items-center text-white', compact ? 'gap-1.5' : 'gap-2')}>
                    <svg className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span className={compact ? 'text-xs font-medium' : 'text-sm font-medium'}>
                        Prossimo film tra: <span className="text-blue-400 font-bold">{countdown}s</span>
                    </span>
                </div>
            </div>

            <div className="content-gutter">
                <div className={cn('flex w-full overflow-x-auto', compact ? 'gap-2' : 'gap-3')}>
                    {upcomingMovies.map(({ movie, originalIndex }) => {
                        const title = movie.title || 'Titolo non disponibile'
                        const backdropPath = movie.backdrop_path || movie.poster_path
                        const isMovieHovered = hoveredMovieId === movie.id

                        return (
                            <button
                                key={movie.id}
                                type="button"
                                className={cn(
                                    'group relative min-w-[9.5rem] flex-1 overflow-hidden rounded-lg text-left',
                                    compact ? 'h-20' : 'aspect-video'
                                )}
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleMovieSelect(originalIndex)
                                }}
                                onMouseEnter={() => handleMovieMouseEnter(movie.id)}
                                onMouseLeave={handleMovieMouseLeave}
                            >
                                <Image
                                    src={backdropPath ? `https://image.tmdb.org/t/p/w500${backdropPath}` : '/placeholder-movie.svg'}
                                    alt={title}
                                    fill
                                    className={cn(
                                        'object-cover transition-transform duration-300 ease-out',
                                        isMovieHovered && 'scale-105'
                                    )}
                                    sizes="(max-width: 768px) 50vw, 16vw"
                                />

                                <div className={cn(
                                    'absolute inset-0 transition-colors duration-300',
                                    isMovieHovered ? 'bg-black/20' : 'bg-black/40 group-hover:bg-black/20'
                                )} />

                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className={cn(
                                        'rounded-full border border-white/30 p-3 backdrop-blur-sm transition-transform duration-300',
                                        isMovieHovered ? 'scale-110 bg-black/80' : 'bg-black/60 group-hover:bg-black/80'
                                    )}>
                                        <svg className="h-5 w-5 fill-white text-white" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    </div>
                                </div>

                                <div className={cn(
                                    'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent',
                                    compact ? 'p-2' : 'p-3'
                                )}>
                                    <h4 className="truncate text-xs font-semibold text-white">
                                        {title}
                                    </h4>
                                    {isMovieHovered && (
                                        <p className="mt-1 line-clamp-2 text-xs text-gray-300">
                                            {movie.overview || 'Descrizione non disponibile'}
                                        </p>
                                    )}
                                </div>

                                {isMovieHovered && (
                                    <div className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-white" />
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
