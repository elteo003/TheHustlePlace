'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play, Star } from 'lucide-react'
import { TMDBMovie, getTMDBImageUrl } from '@/lib/tmdb'

interface Top10MovieCardProps {
    movie: TMDBMovie
    rank: number
    showRank?: boolean
    className?: string
}

export function Top10MovieCard({ movie, rank, showRank = true, className = '' }: Top10MovieCardProps) {
    const [imageError, setImageError] = useState(false)
    const [isHovered, setIsHovered] = useState(false)

    const handlePlay = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        window.location.href = `/player/movie/${movie.id}`
    }

    return (
        <div
            className={`relative group cursor-pointer transition-all duration-300 hover:scale-105 ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Card className="relative bg-gray-900 rounded-lg overflow-hidden shadow-lg border-0">
                {/* Poster */}
                <div className="relative aspect-[2/3] overflow-hidden">
                    <Image
                        src={getTMDBImageUrl(movie.poster_path, 'w500')}
                        alt={movie.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        onError={() => setImageError(true)}
                    />

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300" />

                    {/* Play Button */}
                    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'
                        }`}>
                        <Button
                            onClick={handlePlay}
                            className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30 px-6 py-3 rounded-lg flex items-center gap-2 font-semibold transition-all duration-200 hover:scale-105"
                        >
                            <Play className="w-5 h-5" />
                            Play
                        </Button>
                    </div>

                    {/* Rank Badge */}
                    {showRank && (
                        <div className="absolute top-0 left-0 w-16 h-20 bg-gradient-to-br from-blue-500/90 to-purple-600/90 flex items-center justify-center z-10 backdrop-blur-sm rounded-br-lg">
                            <span className="text-white font-bold text-2xl drop-shadow-lg">
                                {rank}
                            </span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-4">
                    {/* Title */}
                    <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2 leading-tight">
                        {movie.title}
                    </h3>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-2">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-gray-300 text-sm font-medium">
                            {movie.vote_average.toFixed(1)}
                        </span>
                        <span className="text-gray-500 text-xs">
                            ({movie.vote_count.toLocaleString()})
                        </span>
                    </div>

                    {/* Popularity */}
                    <div className="text-gray-400 text-xs">
                        Popolarità: {Math.round(movie.popularity)}
                    </div>
                </div>
            </Card>
        </div>
    )
}