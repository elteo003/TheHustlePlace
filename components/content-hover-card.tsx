'use client'

import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react'
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
const PREVIEW_WIDTH = 320
const PREVIEW_PAD = 16

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
    const slotRef = useRef<HTMLDivElement>(null)
    const expandTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [sheetOpen, setSheetOpen] = useState(false)
    const [previewPos, setPreviewPos] = useState<{ top: number; left: number } | null>(null)
    const [portalReady, setPortalReady] = useState(false)

    const itemType = resolveContentType(item, type)
    const itemId = getContentId(item)
    const title = getContentTitle(item, itemType)
    const year = getYear(item, itemType)
    const rating = item.vote_average > 0 ? item.vote_average.toFixed(1) : null
    const previewImage = getContentPosterUrl(item.backdrop_path || item.poster_path, 'w780')

    const { trailerUrl, isLoading, scheduleTrailerLoad, resetPreview } = useTrailerPreview(
        itemId,
        itemType,
        400
    )

    const placePreview = () => {
        const slot = slotRef.current
        if (!slot) return
        const rect = slot.getBoundingClientRect()
        const left = Math.min(
            Math.max(PREVIEW_PAD, rect.left + rect.width / 2 - PREVIEW_WIDTH / 2),
            window.innerWidth - PREVIEW_WIDTH - PREVIEW_PAD
        )
        const estimatedHeight = PREVIEW_WIDTH * (9 / 16) + 112
        const top = Math.min(
            Math.max(PREVIEW_PAD, rect.top - 12),
            window.innerHeight - estimatedHeight - PREVIEW_PAD
        )
        setPreviewPos({ top, left })
    }

    useLayoutEffect(() => {
        if (!isExpanded || isTouch) {
            setPreviewPos(null)
            return
        }
        placePreview()
    }, [isExpanded, isTouch])

    useEffect(() => {
        if (!isExpanded) return
        const collapse = () => {
            onCollapse()
            resetPreview()
        }
        window.addEventListener('scroll', collapse, true)
        window.addEventListener('resize', collapse)
        return () => {
            window.removeEventListener('scroll', collapse, true)
            window.removeEventListener('resize', collapse)
        }
    }, [isExpanded, onCollapse, resetPreview])

    useEffect(() => {
        setPortalReady(true)
        return () => {
            if (expandTimer.current) clearTimeout(expandTimer.current)
            if (closeTimer.current) clearTimeout(closeTimer.current)
        }
    }, [])

    const cancelClose = () => {
        if (closeTimer.current) {
            clearTimeout(closeTimer.current)
            closeTimer.current = null
        }
    }

    const scheduleClose = () => {
        if (isTouch) return
        if (expandTimer.current) {
            clearTimeout(expandTimer.current)
            expandTimer.current = null
        }
        cancelClose()
        closeTimer.current = setTimeout(() => {
            onCollapse()
            resetPreview()
        }, 120)
    }

    const handleMouseEnter = () => {
        if (isTouch) return
        cancelClose()
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
        : { duration: 0.2, ease: [0.16, 1, 0.3, 1] }

    const preview = (
        <AnimatePresence>
            {isExpanded && !isTouch && previewPos && (
                <motion.div
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.84 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={reduceMotion ? undefined : { opacity: 0, scale: 0.9 }}
                    transition={motionTransition}
                    className="fixed z-[80] overflow-hidden rounded-xl bg-zinc-950 shadow-[0_24px_80px_rgba(0,0,0,0.65)] ring-1 ring-white/10 origin-top"
                    style={{
                        top: previewPos.top,
                        left: previewPos.left,
                        width: PREVIEW_WIDTH,
                    }}
                    onMouseEnter={cancelClose}
                    onMouseLeave={scheduleClose}
                    onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
                >
                    <div className="relative aspect-video bg-zinc-900">
                        <Image
                            src={previewImage}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="320px"
                            style={{ opacity: trailerUrl ? 0 : 1 }}
                        />
                        {trailerUrl && (
                            <iframe
                                src={trailerUrl}
                                className="absolute inset-0 h-full w-full pointer-events-none"
                                tabIndex={-1}
                                allow="autoplay; encrypted-media"
                                title={`Trailer ${title}`}
                            />
                        )}
                        {isLoading && !trailerUrl && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                <Spinner size="sm" />
                            </div>
                        )}
                    </div>

                    <div className="p-3.5">
                        <h3 className="text-white font-semibold text-[15px] leading-snug line-clamp-1">
                            {title}
                        </h3>
                        {(year || rating) && (
                            <p className="mt-1 flex items-center gap-2 text-xs text-white/55">
                                {year && <span>{year}</span>}
                                {year && rating && <span className="text-white/25">·</span>}
                                {rating && (
                                    <span className="inline-flex items-center gap-1">
                                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                        {rating}
                                    </span>
                                )}
                            </p>
                        )}
                        <div className="mt-3 flex items-center gap-2">
                            {onPlay && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onPlay(itemId, itemType)
                                    }}
                                    className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30 px-3.5 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-transform duration-200 hover:scale-105"
                                    aria-label={`Guarda ${title}`}
                                >
                                    <Play className="w-4 h-4" />
                                    Play
                                </button>
                            )}
                            {onDetails && (
                                <DetailLink
                                    id={itemId}
                                    type={itemType}
                                    className="btn-ghost-outline text-sm py-2 px-3.5 inline-flex items-center gap-1.5"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Info className="w-4 h-4" />
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
                ref={slotRef}
                className={`relative flex-shrink-0 ${
                    variant === 'carousel' ? 'w-[200px] h-[300px]' : 'w-full aspect-[2/3]'
                } ${isExpanded ? 'z-30' : 'z-0'}`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={scheduleClose}
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
