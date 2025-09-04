'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
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

    const handlePlay = useCallback((e: React.MouseEvent) => {
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
    }, [item, type])

    return (
        <Card
            ref={cardRef}
            className="group relative bg-transparent border border-transparent p-0 cursor-pointer 
                       transition-all duration-300 ease-out
                       hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/25
                       hover:border-white/10
                       will-change-transform"
        >
            {/* Card Container */}
            <div className="relative aspect-[2/3] overflow-hidden rounded-lg">
                {/* Skeleton Loader */}
                {!isInView && <SkeletonLoader type="movie" />}

                {/* Poster Image - Optimized */}
                {isInView && (
                    <>
                        {!imageLoaded && <SkeletonLoader type="movie" />}
                        <Image
                            src={imageError ? '/placeholder-movie.svg' : getImageUrl(item.poster_path, 'w500')}
                            alt={title}
                            fill
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                            className={`object-cover transition-transform duration-500 ease-out
                                      group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
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
                            loading="lazy"
                            quality={85}
                        />
                    </>
                )}

                {/* Gradient Overlay - Always Present */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent 
                               opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out" />

                {/* Content Overlay - Always Present */}
                <div className="absolute inset-0 flex flex-col justify-end p-4
                               opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out">
                    
                    {/* Title */}
                    <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2 leading-tight">
                        {title}
                    </h3>

                    {/* Info Row */}
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

                    {/* Description */}
                    {showDetails && (
                        <p className="text-gray-300 text-xs line-clamp-2 mb-3 leading-relaxed">
                            {item.overview}
                        </p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20 transition-colors duration-200"
                        >
                            <Plus className="w-4 h-4" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20 transition-colors duration-200"
                        >
                            <Heart className="w-4 h-4" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20 transition-colors duration-200"
                        >
                            <Bookmark className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Play Button - Always Present */}
                <div className="absolute inset-0 flex items-center justify-center
                               opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out">
                    <Button
                        size="lg"
                        className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 
                                 border border-white/30 transition-all duration-200 ease-out
                                 hover:scale-105 hover:shadow-lg"
                        onClick={handlePlay}
                    >
                        <Play className="w-6 h-6" />
                    </Button>
                </div>
            </div>

            {/* Title Below Card - Always Present */}
            <div className="mt-3 px-1">
                <h3 className="text-white font-medium text-sm line-clamp-2 leading-tight">
                    {title}
                </h3>
                <div className="flex items-center justify-between mt-1">
                    <span className="text-gray-400 text-xs">{year || 'N/A'}</span>
                    <div className="flex items-center space-x-1">
                        <span className="text-yellow-400 text-xs">★</span>
                        <span className="text-gray-400 text-xs">
                            {formatVoteAverage(item.vote_average)}
                        </span>
                    </div>
                </div>
            </div>
        </Card>
    )
}