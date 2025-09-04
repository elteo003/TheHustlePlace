'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play } from 'lucide-react'
import { Movie } from '@/types'
import { getImageUrl, getAvailabilityBadge, getAvailabilityColor } from '@/lib/utils'
import { useAvailability } from '@/hooks/useAvailability'

interface Top10MovieCardProps {
    movie: Movie
    rank: number
}

export function Top10MovieCard({ movie, rank }: Top10MovieCardProps) {
    const [imageError, setImageError] = useState(false)
    
    // Controllo disponibilità reale
    const initialBadge = getAvailabilityBadge(movie)
    const tmdbId = movie.tmdb_id || movie.id
    const { availability } = useAvailability(tmdbId, 'movie', initialBadge)

    const handlePlay = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        // Usa tmdb_id se disponibile, altrimenti id
        const movieId = movie.tmdb_id || movie.id
        window.location.href = `/player/movie/${movieId}`
    }

    return (
        <Card className="group relative bg-transparent border border-transparent p-0 cursor-pointer 
                       transition-all duration-300 ease-out
                       hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/25
                       hover:border-white/10
                       will-change-transform">
            <div className="relative aspect-[2/3] overflow-hidden rounded-lg">
                {/* Poster Image - Optimized */}
                <Image
                    src={imageError ? '/placeholder-movie.svg' : getImageUrl(movie.poster_path, 'w500')}
                    alt={movie.title}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    onError={() => setImageError(true)}
                    priority={false}
                    loading="lazy"
                    quality={85}
                />

                {/* Rank Number - Stile Netflix */}
                <div className="absolute top-0 left-0 w-16 h-20 bg-gradient-to-br from-gray-800/90 to-gray-900/90 
                               flex items-center justify-center z-10 backdrop-blur-sm">
                    <span className="text-white font-bold text-2xl drop-shadow-lg">
                        {rank}
                    </span>
                </div>

                {/* Gradient Overlay - Always Present */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent 
                               opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out" />

                {/* Play Button Overlay */}
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

            {/* Title below card */}
            <div className="mt-2">
                <h3 className="text-white font-medium text-sm line-clamp-2">
                    {movie.title}
                </h3>
                <div className="flex items-center justify-between mt-1">
                    <span className="text-gray-400 text-xs">
                        {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
                    </span>
                    <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAvailabilityColor(availability.badge || 'Disponibile')}`}>
                            {availability.badge || 'Disponibile'}
                        </span>
                        <div className="flex items-center space-x-1">
                            <span className="text-yellow-400 text-xs">★</span>
                            <span className="text-gray-400 text-xs">
                                {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    )
}
