'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Play, Star, Calendar } from 'lucide-react'
import { TMDBMovie, getTMDBImageUrl } from '@/lib/tmdb'
import { Movie } from '@/types'

interface MovieCardProps {
    movie: TMDBMovie | Movie
    rank?: number
    showRank?: boolean
    showReleaseDate?: boolean
    className?: string
    type?: 'movie' | 'tv'
}

export function MovieCard({
    movie,
    rank,
    showRank = false,
    showReleaseDate = false,
    className = '',
    type = 'movie'
}: MovieCardProps) {
    const [isHovered, setIsHovered] = useState(false)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const handlePlay = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        // Usa tmdb_id se disponibile, altrimenti id
        const itemId = (movie as any).tmdb_id || movie.id
        const url = type === 'movie'
            ? `/player/movie/${itemId}`
            : `/player/tv/${itemId}`
        window.location.href = url
    }

    if (!isMounted) {
        return (
            <div className={`relative bg-gray-900 rounded-lg overflow-hidden shadow-lg animate-pulse ${className}`}>
                <div className="aspect-[2/3] bg-gray-800"></div>
                <div className="p-4">
                    <div className="h-4 bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                </div>
            </div>
        )
    }

    const formatReleaseDate = (dateString: string) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toLocaleDateString('it-IT', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    const getImageUrl = (posterPath: string | null | undefined) => {
        if (!posterPath || posterPath === '/placeholder-movie.svg') {
            return '/placeholder-movie.svg'
        }
        return getTMDBImageUrl(posterPath, 'w500')
    }

    return (
        <div
            className={`relative group cursor-pointer card-hover ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Card Container */}
            <div className="relative bg-gray-900 rounded-lg shadow-lg group-hover:shadow-2xl group-hover:shadow-blue-500/20 transition-all duration-500">
                {/* Poster */}
                <div className="relative aspect-[2/3] overflow-hidden">
                    <Image
                        src={getImageUrl(movie.poster_path)}
                        alt={movie.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-500 ease-out" />

                    {/* Play Button */}
                    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                        }`}>
                        <button
                            onClick={handlePlay}
                            className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30 px-6 py-3 rounded-lg flex items-center gap-2 font-semibold transition-all duration-200 hover:scale-105"
                        >
                            <Play className="w-5 h-5" />
                            Play
                        </button>
                    </div>

                    {/* Rank Badge */}
                    {showRank && rank && (
                        <div className="absolute top-0 left-0 w-16 h-20 bg-gradient-to-br from-blue-500/90 to-purple-600/90 flex items-center justify-center z-10 backdrop-blur-sm rounded-br-lg">
                            <span className="text-white font-bold text-2xl drop-shadow-lg">
                                {rank}
                            </span>
                        </div>
                    )}

                    {/* Release Date Badge */}
                    {showReleaseDate && movie.release_date && (
                        <div className="absolute top-2 right-2 bg-gradient-to-r from-blue-500/90 to-purple-600/90 text-white px-2 py-1 rounded-md text-xs font-semibold backdrop-blur-sm">
                            {formatReleaseDate(movie.release_date)}
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
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-gray-300 text-sm font-medium">
                                {movie.vote_average.toFixed(1)}
                            </span>
                        </div>

                        {showReleaseDate && movie.release_date && (
                            <div className="flex items-center gap-1 text-gray-400 text-xs">
                                <Calendar className="w-3 h-3" />
                                <span>{formatReleaseDate(movie.release_date)}</span>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    )
}