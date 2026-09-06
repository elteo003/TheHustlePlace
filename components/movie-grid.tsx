'use client'

import { useState } from 'react'
import { ContentType, getContentId } from '@/lib/content-navigation'
import { ContentItem } from '@/lib/content-display'
import { ContentHoverCard } from '@/components/content-hover-card'
import { CustomScrollbar } from '@/components/custom-scrollbar'
import { TrailerDock } from '@/components/trailer-dock'
import { useRowPeek } from '@/contexts/trailer-peek-context'
import { useIsCoarsePointer } from '@/hooks/useMediaQuery'

interface MovieGridProps {
    movies: ContentItem[]
    type?: ContentType
    onPlay?: (id: number, type?: ContentType) => void
    onDetails?: (id: number, type?: ContentType) => void
}

export default function MovieGrid({ movies, type = 'movie', onPlay, onDetails }: MovieGridProps) {
    const isTouch = useIsCoarsePointer()
    const [expandedId, setExpandedId] = useState<number | null>(null)
    const { peekId, isPosterHidden, onPeek, onClose, onExited } = useRowPeek()
    const peekItem = movies.find((movie) => getContentId(movie) === peekId) ?? null

    return (
        <div className="w-full">
            <CustomScrollbar className="pt-2 pb-8" containerClassName="gap-4 items-start">
                {movies.map((movie) => {
                    const id = getContentId(movie)
                    return (
                        <div
                            key={id}
                            className={`flex-shrink-0 ${expandedId === id || peekId === id ? 'z-30' : 'z-0 hover:z-20'}`}
                        >
                            <ContentHoverCard
                                item={movie}
                                type={type}
                                variant="carousel"
                                isExpanded={!isTouch && expandedId === id}
                                onExpand={() => setExpandedId(id)}
                                onCollapse={() => setExpandedId(null)}
                                onPeek={() => onPeek(id)}
                                isPeeking={isPosterHidden(id)}
                                onPlay={onPlay}
                                onDetails={onDetails}
                            />
                        </div>
                    )
                })}
            </CustomScrollbar>
            <TrailerDock
                item={isTouch ? peekItem : null}
                type={type}
                onClose={onClose}
                onExited={onExited}
                onPlay={onPlay}
                onDetails={onDetails}
            />
        </div>
    )
}
