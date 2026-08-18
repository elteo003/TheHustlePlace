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

    return (
        <div className={`relative group cursor-pointer ${className}`}>
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

                    {!isTouch && (
                        <button
                            type="button"
                            onClick={handlePlay}
                            className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out"
                            aria-label={`Guarda ${movie.title}`}
                        >
                            <span className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-lg scale-90 group-hover:scale-100 transition-transform duration-300 ease-out">
                                <Play className="w-5 h-5 fill-current ml-0.5" />
                            </span>
                        </button>
                    )}

                    {isTouch && (
                        <button
                            type="button"
                            onClick={handlePlay}
                            className="absolute bottom-2 right-2 z-10 w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg"
                            aria-label={`Guarda ${movie.title}`}
                        >
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                        </button>
                    )}

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
