'use client'

import { useState } from 'react'
import { ContentType } from '@/lib/content-navigation'
import { ContentItem } from '@/lib/content-display'
import { ContentHoverCard } from '@/components/content-hover-card'
import { CustomScrollbar } from '@/components/custom-scrollbar'

interface MovieGridProps {
    movies: ContentItem[]
    type?: ContentType
    onPlay?: (id: number, type?: ContentType) => void
    onDetails?: (id: number, type?: ContentType) => void
}

export default function MovieGrid({ movies, type = 'movie', onPlay, onDetails }: MovieGridProps) {
    const [expandedId, setExpandedId] = useState<number | null>(null)

    return (
        <div className="w-full">
            <CustomScrollbar className="pt-2 pb-8" containerClassName="gap-4 items-start">
                {movies.map((movie) => (
                    <div
                        key={movie.id}
                        className={`flex-shrink-0 ${expandedId === movie.id ? 'z-30' : 'z-0'}`}
                    >
                        <ContentHoverCard
                            item={movie}
                            type={type}
                            variant="carousel"
                            isExpanded={expandedId === movie.id}
                            onExpand={() => setExpandedId(movie.id)}
                            onCollapse={() => setExpandedId(null)}
                            onPlay={onPlay}
                            onDetails={onDetails}
                        />
                    </div>
                ))}
            </CustomScrollbar>
        </div>
    )
}
