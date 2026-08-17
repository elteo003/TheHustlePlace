'use client'

import { useState } from 'react'
import { Play, Info } from 'lucide-react'
import Image from 'next/image'
import { ContentType, getContentId } from '@/lib/content-navigation'
import { ContentItem, getContentPosterUrl, getContentTitle, resolveContentType } from '@/lib/content-display'
import { useTrailerPreview } from '@/hooks/useTrailerPreview'
import { useIsCoarsePointer } from '@/hooks/useMediaQuery'
import { ContentActionSheet } from '@/components/ui/content-action-sheet'
import { PosterTransition } from '@/components/ui/poster-transition'
import { DetailLink } from '@/components/ui/detail-link'
import { Spinner } from '@/components/ui/spinner'

interface ContentHoverCardProps {
    item: ContentItem
    type?: ContentType
    isExpanded: boolean
    onExpand: () => void
    onCollapse: () => void
    onPlay?: (id: number, type?: ContentType) => void
    onDetails?: (id: number, type?: ContentType) => void
    variant?: 'carousel' | 'grid'
}

export function ContentHoverCard({
    item,
    type = 'movie',
    isExpanded,
    onExpand,
    onCollapse,
    onPlay,
    onDetails,
    variant = 'carousel',
}: ContentHoverCardProps) {
    const isTouch = useIsCoarsePointer()
    const [sheetOpen, setSheetOpen] = useState(false)
    const itemType = resolveContentType(item, type)
    const itemId = getContentId(item)
    const title = getContentTitle(item, itemType)
    const { trailerUrl, isLoading, scheduleTrailerLoad, resetPreview } = useTrailerPreview(
        itemId,
        itemType
    )

    const handleMouseEnter = () => {
        if (isTouch) return
        onExpand()
        scheduleTrailerLoad()
    }

    const handleMouseLeave = () => {
        if (isTouch) return
        onCollapse()
        resetPreview()
    }

    const handleTap = () => {
        if (isTouch) {
            setSheetOpen(true)
            return
        }
        onExpand()
        scheduleTrailerLoad()
    }

    const widthClass = isExpanded
        ? variant === 'carousel'
            ? 'w-[min(500px,85vw)]'
            : 'w-full'
        : variant === 'carousel'
          ? 'w-[200px]'
          : 'w-full'

    return (
        <>
            <div
                className={`relative flex-shrink-0 transition-transform duration-[180ms] ease-spring cursor-pointer ${widthClass}`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={handleTap}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleTap()
                    }
                }}
                role="button"
                tabIndex={0}
                aria-label={title}
            >
                <div
                    className={`relative bg-zinc-900 rounded-lg overflow-hidden group focus-within:ring-2 focus-within:ring-white/30 ${
                        variant === 'carousel' ? 'h-[300px]' : 'aspect-[2/3]'
                    }`}
                >
                    <PosterTransition
                        type={itemType}
                        id={itemId}
                        className="relative w-full h-full"
                    >
                        <Image
                            src={getContentPosterUrl(item.poster_path)}
                            alt={title}
                            fill
                            className="object-cover transition-opacity duration-300"
                            style={{ opacity: isExpanded && trailerUrl && !isTouch ? 0 : 1 }}
                            sizes="(max-width: 768px) 50vw, 200px"
                        />
                    </PosterTransition>

                    {isExpanded && !isTouch && trailerUrl && (
                        <div
                            className={`absolute inset-0 ${variant === 'carousel' ? 'h-[200px]' : 'h-full'}`}
                        >
                            <iframe
                                src={trailerUrl}
                                className="w-full h-full"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                title={`Trailer ${title}`}
                            />
                        </div>
                    )}

                    {isExpanded && isLoading && !isTouch && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <Spinner size="sm" />
                        </div>
                    )}

                    {/* Mobile: persistent play affordance */}
                    {isTouch && onPlay && (
                        <button
                            type="button"
                            className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg"
                            onClick={(e) => {
                                e.stopPropagation()
                                onPlay(itemId, itemType)
                            }}
                            aria-label={`Guarda ${title}`}
                        >
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                        </button>
                    )}

                    {isExpanded && !isTouch && (
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                            <h3 className="text-white font-semibold text-base mb-1.5 line-clamp-2">
                                {title}
                            </h3>
                            <p className="text-white/60 text-sm line-clamp-2 mb-3">
                                {item.overview || 'Descrizione non disponibile'}
                            </p>
                            <div className="flex gap-2">
                                {onPlay && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onPlay(itemId, itemType)
                                        }}
                                        className="btn-play text-sm py-2 px-4 flex items-center gap-1.5"
                                        aria-label={`Guarda ${title}`}
                                    >
                                        <Play className="w-4 h-4 fill-current" />
                                        Guarda
                                    </button>
                                )}
                                {onDetails && (
                                    <DetailLink
                                        id={itemId}
                                        type={itemType}
                                        className="btn-ghost-outline text-sm py-2 px-4 flex items-center gap-1.5"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Info className="w-4 h-4" />
                                        Dettagli
                                    </DetailLink>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ContentActionSheet
                open={sheetOpen}
                onClose={() => setSheetOpen(false)}
                title={title}
                overview={item.overview}
                posterUrl={getContentPosterUrl(item.poster_path)}
                contentType={itemType}
                onPlay={() => onPlay?.(itemId, itemType)}
                onDetails={() => onDetails?.(itemId, itemType)}
            />
        </>
    )
}
