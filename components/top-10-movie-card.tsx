'use client'

import { MovieCard } from '@/components/movie-card'
import { TMDBMovie } from '@/lib/tmdb'
import { ContentType } from '@/lib/content-navigation'

interface Top10MovieCardProps {
    movie: TMDBMovie
    rank: number
    contentType?: ContentType
    showRank?: boolean
    className?: string
}

/** Wrapper per la Top 10: riusa MovieCard con badge ranking. */
export function Top10MovieCard({
    movie,
    rank,
    contentType = 'movie',
    showRank = true,
    className = '',
}: Top10MovieCardProps) {
    return (
        <MovieCard
            movie={movie}
            rank={rank}
            showRank={showRank}
            className={className}
            type={contentType}
        />
    )
}
