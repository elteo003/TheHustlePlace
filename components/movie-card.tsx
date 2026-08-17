'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Play, Star } from 'lucide-react'
import { useIsCoarsePointer } from '@/hooks/useMediaQuery'
import { PosterTransition } from '@/components/ui/poster-transition'
import { getContentId, getPlayerPath } from '@/lib/content-navigation'
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
    type = 'movie',
}: MovieCardProps) {
    const router = useRouter()
    const isTouch = useIsCoarsePointer()
    const [isHovered, setIsHovered] = useState(false)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const handlePlay = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        const itemId = getContentId(movie as { id: number; tmdb_id?: number })
        router.push(getPlayerPath(itemId, type))
    }

    if (!isMounted) {
        return (
            <div
                className={`relative bg-zinc-900 rounded-lg overflow-hidden animate-pulse ${className}`}
            >
                <div className="aspect-[2/3] bg-zinc-800" />
            </div>
        )
    }

    const getImageUrl = (posterPath: string | null | undefined) => {
        if (!posterPath || posterPath === '/placeholder-movie.svg') {
            return '/placeholder-movie.svg'
        }
        return getTMDBImageUrl(posterPath, 'w500')
    }

    const showPlay = isTouch || isHovered

    return (
        <div
            className={`relative group cursor-pointer ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="relative bg-zinc-900 rounded-lg overflow-hidden hover-lift group-hover:z-10">
                <div className="relative aspect-[2/3] overflow-hidden">
                    <PosterTransition
                        type={type}
                        id={getContentId(movie as { id: number; tmdb_id?: number })}
                        className="absolute inset-0"
                    >
                        <Image
                            src={getImageUrl(movie.poster_path)}
                            alt={movie.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 200px"
                        />
                    </PosterTransition>

                    <div
                        className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
                            showPlay ? 'opacity-100' : 'opacity-0'
                        }`}
                    />

                    <div
                        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
                            showPlay ? 'opacity-100' : 'opacity-0'
                        }`}
                    >
                        <button
                            type="button"
                            onClick={handlePlay}
                            className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
                            aria-label={`Guarda ${movie.title}`}
                        >
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                        </button>
                    </div>

                    {showRank && rank && (
                        <div className="absolute top-2 left-2 w-8 h-8 rounded-md bg-black/70 backdrop-blur-sm flex items-center justify-center">
                            <span className="text-white font-bold text-sm">{rank}</span>
                        </div>
                    )}
                </div>

                <div className="p-3">
                    <h3 className="text-white font-medium text-sm line-clamp-2 leading-snug mb-1.5">
                        {movie.title}
                    </h3>
                    <div className="flex items-center gap-1 text-white/50 text-xs">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        {movie.vote_average.toFixed(1)}
                    </div>
                </div>
            </div>
        </div>
    )
}
