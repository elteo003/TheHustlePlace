'use client'

import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { Play, Info, Star } from 'lucide-react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { ContentType, getContentId } from '@/lib/content-navigation'
import { ContentItem, getContentPosterUrl, getContentTitle, resolveContentType } from '@/lib/content-display'
import { useTrailerPreview } from '@/hooks/useTrailerPreview'
import { useIsCoarsePointer, useReducedMotion } from '@/hooks/useMediaQuery'
import { ContentActionSheet } from '@/components/ui/content-action-sheet'
import { PosterTransition } from '@/components/ui/poster-transition'
import { DetailLink } from '@/components/ui/detail-link'
import { Spinner } from '@/components/ui/spinner'
import { Movie, TVShow } from '@/types'

const EXPAND_DELAY_MS = 260

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

function getYear(item: ContentItem, type: ContentType): number | null {
    const raw = type === 'tv' ? (item as TVShow).first_air_date : (item as Movie).release_date
    if (!raw) return null
    const year = new Date(raw).getFullYear()
    return Number.isFinite(year) ? year : null
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
    const reduceMotion = useReducedMotion()
    const expandTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [sheetOpen, setSheetOpen] = useState(false)
    const [portalReady, setPortalReady] = useState(false)

    const itemType = resolveContentType(item, type)
    const itemId = getContentId(item)
    const title = getContentTitle(item, itemType)
    const year = getYear(item, itemType)
    const rating = item.vote_average > 0 ? item.vote_average.toFixed(1) : null
    const previewImage = getContentPosterUrl(item.backdrop_path || item.poster_path, 'original')

    const { trailerUrl, isLoading, scheduleTrailerLoad, resetPreview } = useTrailerPreview(
        itemId,
        itemType,
        400
    )

    const closeNow = () => {
        if (expandTimer.current) {
            clearTimeout(expandTimer.current)
            expandTimer.current = null
        }
        onCollapse()
        resetPreview()
    }

    useEffect(() => {
        if (!isExpanded) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeNow()
        }
        window.addEventListener('keydown', onKey)
        window.addEventListener('scroll', closeNow)
        return () => {
            window.removeEventListener('keydown', onKey)
            window.removeEventListener('scroll', closeNow)
        }
    }, [isExpanded, onCollapse, resetPreview])

    useEffect(() => {
        setPortalReady(true)
        return () => {
            if (expandTimer.current) clearTimeout(expandTimer.current)
        }
    }, [])

    const handleMouseLeave = () => {
        if (isTouch) return
        if (expandTimer.current) {
            clearTimeout(expandTimer.current)
            expandTimer.current = null
        }
    }

    const handleMouseEnter = () => {
        if (isTouch) return
        if (expandTimer.current) clearTimeout(expandTimer.current)
        expandTimer.current = setTimeout(() => {
            onExpand()
            scheduleTrailerLoad()
        }, EXPAND_DELAY_MS)
    }

    const handleTap = () => {
        if (isTouch) {
            setSheetOpen(true)
            return
        }
        onExpand()
        scheduleTrailerLoad()
    }

    const motionTransition = reduceMotion
        ? { duration: 0 }
        : { duration: 0.28, ease: [0.16, 1, 0.3, 1] }

    const preview = (
        <AnimatePresence>
            {isExpanded && !isTouch && (
                <motion.div
                    role="dialog"
                    aria-label={title}
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={reduceMotion ? undefined : { opacity: 0 }}
                    transition={motionTransition}
                    className="fixed inset-0 z-[80] overflow-hidden bg-black"
                    onClick={closeNow}
                >
                    <div className="absolute inset-0 overflow-hidden">
                        <Image
                            src={previewImage}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="100vw"
                            style={{ opacity: trailerUrl ? 0 : 1 }}
                        />
                        {trailerUrl && (
                            <iframe
                                src={trailerUrl}
                                className="pointer-events-none"
                                tabIndex={-1}
                                allow="autoplay; encrypted-media"
                                title={`Trailer ${title}`}
                                style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    width: '100vw',
                                    height: '100vh',
                                    transform: 'translate(-50%, -50%) scale(1.08)',
                                    border: 0,
                                }}
                            />
                        )}
                        {isLoading && !trailerUrl && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                <Spinner size="sm" />
                            </div>
                        )}
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent pointer-events-none" />
                    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none" />

                    <div
                        className="absolute bottom-16 left-4 z-10 max-w-2xl px-4"
                        onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
                    >
                        <h3 className="text-4xl md:text-6xl font-bold text-white leading-tight">
                            {title}
                        </h3>
                        {(year || rating) && (
                            <p className="mt-3 flex items-center gap-2 text-base text-white/60">
                                {year && <span>{year}</span>}
                                {year && rating && <span className="text-white/25">·</span>}
                                {rating && (
                                    <span className="inline-flex items-center gap-1.5">
                                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                        {rating}
                                    </span>
                                )}
                            </p>
                        )}
                        <div className="mt-8 flex flex-wrap items-center gap-3">
                            {onPlay && (
                                <button
                                    type="button"
                                    onClick={() => onPlay(itemId, itemType)}
                                    className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30 px-6 py-3 rounded-lg flex items-center gap-2 font-semibold transition-transform duration-200 hover:scale-105"
                                    aria-label={`Guarda ${title}`}
                                >
                                    <Play className="w-5 h-5" />
                                    Play
                                </button>
                            )}
                            {onDetails && (
                                <DetailLink
                                    id={itemId}
                                    type={itemType}
                                    className="btn-ghost-outline px-6 py-3 inline-flex items-center gap-2"
                                >
                                    <Info className="w-5 h-5" />
                                    Dettagli
                                </DetailLink>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )

    return (
        <>
            <div
                className={`relative flex-shrink-0 ${
                    variant === 'carousel' ? 'w-[200px] h-[300px]' : 'w-full aspect-[2/3]'
                }`}
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
                <div className="relative h-full w-full overflow-hidden rounded-lg bg-zinc-900 hover-lift">
                    <PosterTransition type={itemType} id={itemId} className="absolute inset-0">
                        <Image
                            src={getContentPosterUrl(item.poster_path)}
                            alt={title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 200px"
                        />
                    </PosterTransition>

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
                </div>
            </div>

            {portalReady ? createPortal(preview, document.body) : null}

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
