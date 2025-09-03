'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play, Plus, Heart, Bookmark } from 'lucide-react'
import { Movie, TVShow } from '@/types'
import { getImageUrl, formatVoteAverage, getAvailabilityBadge, getAvailabilityColor } from '@/lib/utils'
import { SkeletonLoader } from '@/components/skeleton-loader'
import { useAvailability } from '@/hooks/useAvailability'

interface MovieCardProps {
    item: Movie | TVShow
    type: 'movie' | 'tv'
    showDetails?: boolean
}

export function MovieCard({ item, type, showDetails = true }: MovieCardProps) {
    const [isHovered, setIsHovered] = useState(false)
    const [imageError, setImageError] = useState(false)
    const [isInView, setIsInView] = useState(false)
    const [imageLoaded, setImageLoaded] = useState(false)
    const cardRef = useRef<HTMLDivElement>(null)

    const title = 'title' in item ? item.title : item.name
    const releaseDate = 'release_date' in item ? item.release_date : item.first_air_date
    const year = releaseDate ? new Date(releaseDate).getFullYear() : null
    
    // Controllo disponibilità reale
    const initialBadge = getAvailabilityBadge(item)
    const tmdbId = 'tmdb_id' in item && item.tmdb_id ? item.tmdb_id : item.id
    const { availability } = useAvailability(tmdbId, type, initialBadge)

    // Intersection Observer per lazy loading
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true)
                    observer.disconnect()
                }
            },
            { threshold: 0.1, rootMargin: '50px' }
        )

        if (cardRef.current) {
            observer.observe(cardRef.current)
        }

        return () => observer.disconnect()
    }, [])

    const handlePlay = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        // Naviga al player usando tmdb_id se disponibile, altrimenti id
        const movieId = 'tmdb_id' in item && item.tmdb_id ? item.tmdb_id : item.id

        if (type === 'movie') {
            window.location.href = `/player/movie/${movieId}`
        } else {
            // Per le serie TV, naviga al player con prima stagione/episodio
            window.location.href = `/player/tv/${movieId}?season=1&episode=1`
        }
    }

    return (
        <Card
            ref={cardRef}
            className="movie-card bg-transparent border-0 p-0 group cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="relative aspect-[2/3] overflow-hidden rounded-lg">
                {/* Skeleton Loader */}
                {!isInView && <SkeletonLoader type="movie" />}

                {/* Poster Image - Lazy Loading */}
                {isInView && (
                    <>
                        {!imageLoaded && <SkeletonLoader type="movie" />}
                        <Image
                            src={imageError ? '/placeholder-movie.svg' : getImageUrl(item.poster_path, 'w500')}
                            alt={title}
                            fill
                            className={`object-cover transition-all duration-300 group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'
                                }`}
                            onError={() => {
                                console.log('Errore caricamento immagine:', item.poster_path)
                                setImageError(true)
                                setImageLoaded(true)
                            }}
                            onLoad={() => {
                                console.log('Immagine caricata con successo:', item.poster_path)
                                setImageLoaded(true)
                            }}
                            priority={false}
                            unoptimized={true}
                        />
                    </>
                )}

                {/* Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'
                    }`}>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2">
                            {title}
                        </h3>

                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <span className="text-yellow-400 text-sm">★</span>
                                <span className="text-white text-sm font-medium">
                                    {formatVoteAverage(item.vote_average)}
                                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAvailabilityColor(availability.badge || 'Disponibile')}`}>
                                    {availability.badge || 'Disponibile'}
                                </span>
                                <span className="text-gray-300 text-sm">{year || 'N/A'}</span>
                            </div>
                        </div>

                        {showDetails && (
                            <p className="text-gray-300 text-xs line-clamp-2 mb-3">
                                {item.overview}
                            </p>
                        )}

                        <div className="flex items-center space-x-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-white hover:bg-white/20"
                            >
                                <Plus className="w-4 h-4" />
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-white hover:bg-white/20"
                            >
                                <Heart className="w-4 h-4" />
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-white hover:bg-white/20"
                            >
                                <Bookmark className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Play Button Overlay */}
                <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'
                    }`}>
                    <Button
                        size="lg"
                        className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30"
                        onClick={handlePlay}
                    >
                        <Play className="w-6 h-6" />
                    </Button>
                </div>
            </div>

            {/* Title below card (for non-hover state) */}
            {!isHovered && (
                <div className="mt-3">
                    <h3 className="text-white font-medium text-sm line-clamp-2">
                        {title}
                    </h3>
                    <div className="flex items-center justify-between mt-1">
                        <span className="text-gray-400 text-xs">{year}</span>
                        <div className="flex items-center space-x-1">
                            <span className="text-yellow-400 text-xs">★</span>
                            <span className="text-gray-400 text-xs">
                                {formatVoteAverage(item.vote_average)}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    )
}