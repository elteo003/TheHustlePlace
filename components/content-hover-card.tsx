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

const EXPAND_DELAY_MS = 1000
const CLOSE_ARM_MS = 400

interface ContentHoverCardProps {
    item: ContentItem
    type?: ContentType
    isExpanded: boolean
    onExpand: () => void
    onCollapse: () => void
    onPlay?: (id: number, type?: ContentType) => void
    onDetails?: (id: number, type?: ContentType) => void
    variant?: 'carousel' | 'grid' | 'top10'
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
    const expandedRef = useRef(false)
    const closeArmed = useRef(false)
    const [sheetOpen, setSheetOpen] = useState(false)
    const [portalReady, setPortalReady] = useState(false)
    const [trailerReady, setTrailerReady] = useState(false)

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

    expandedRef.current = isExpanded

    const closeNow = () => {
        if (expandTimer.current) {
            clearTimeout(expandTimer.current)
            expandTimer.current = null
        }
        closeArmed.current = false
        onCollapse()
    }

    const handlePreviewExit = () => {
        if (expandedRef.current) return
        setTrailerReady(false)
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
        if (!isExpanded) {
            closeArmed.current = false
            return
        }
        closeArmed.current = false
        const arm = setTimeout(() => {
            closeArmed.current = true
        }, CLOSE_ARM_MS)
        return () => clearTimeout(arm)
    }, [isExpanded])

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

    const handlePreviewMouseLeave = () => {
        if (!closeArmed.current) return
        closeNow()
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
        : { duration: 0.34, ease: [0.22, 1, 0.36, 1] }

    const preview = (
        <AnimatePresence onExitComplete={handlePreviewExit}>
            {isExpanded && !isTouch && (
                <motion.button
                    key="preview-dim"
                    type="button"
                    aria-label="Chiudi anteprima"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={motionTransition}
                    className="fixed inset-0 z-[90] bg-black/70"
                    onClick={closeNow}
                />
            )}
            {isExpanded && !isTouch && (
                <motion.div
                    key="preview-card"
                    role="dialog"
                    aria-label={title}
                    initial={{ opacity: 0, scale: 0.96, x: '-50%', y: '-50%' }}
                    animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
                    exit={{ opacity: 0, scale: 0.98, x: '-50%', y: '-50%' }}
                    transition={motionTransition}
                    className="fixed left-1/2 top-1/2 z-[91] w-[min(96vw,calc((100vh-4rem)*16/9))] overflow-hidden rounded-2xl bg-black shadow-[0_32px_120px_rgba(0,0,0,0.75)] ring-1 ring-white/10"
                    onMouseLeave={handlePreviewMouseLeave}
                    onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
                >
                    <div className="relative aspect-video overflow-hidden bg-zinc-900">
                        <Image
                            src={previewImage}
                            alt=""
                            fill
                            className="object-cover transition-opacity duration-500 ease-out"
                            sizes="96vw"
                            style={{ opacity: trailerReady ? 0 : 1 }}
                        />
                        {trailerUrl && (
                            <iframe
                                src={trailerUrl}
                                className={`pointer-events-none transition-opacity duration-500 ease-out ${
                                    trailerReady ? 'opacity-100' : 'opacity-0'
                                }`}
                                tabIndex={-1}
                                allow="autoplay; encrypted-media"
                                title={`Trailer ${title}`}
                                onLoad={() => setTrailerReady(true)}
                                style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    width: '100%',
                                    height: '100%',
                                    transform: 'translate(-50%, -50%) scale(1.12)',
                                    border: 0,
                                }}
                            />
                        )}
                        {isLoading && !trailerReady && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                <Spinner size="sm" />
                            </div>
                        )}

                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                            <div className="absolute bottom-0 left-0 right-0 z-10 p-5">
                                <h3 className="text-white font-semibold text-xl leading-snug line-clamp-1">
                                    {title}
                                </h3>
                                {(year || rating) && (
                                    <p className="mt-1 flex items-center gap-2 text-sm text-white/60">
                                        {year && <span>{year}</span>}
                                        {year && rating && <span className="text-white/25">·</span>}
                                        {rating && (
                                            <span className="inline-flex items-center gap-1.5">
                                                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                                {rating}
                                            </span>
                                        )}
                                    </p>
                                )}
                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                    {onPlay && (
                                        <button
                                            type="button"
                                            onClick={() => onPlay(itemId, itemType)}
                                            className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30 px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm font-semibold transition-transform duration-200 hover:scale-105"
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
                                            className="btn-ghost-outline text-sm py-2.5 px-4 inline-flex items-center gap-1.5"
                                        >
                                            <Info className="w-4 h-4" />
                                            Dettagli
                                        </DetailLink>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
            )}
        </AnimatePresence>
    )

    return (
        <>
            <div
                className={`group relative flex-shrink-0 hover:z-20 ${
                    variant === 'top10'
                        ? 'z-[1] w-[120px] sm:w-[140px] md:w-[160px] aspect-[2/3]'
                        : variant === 'carousel'
                          ? 'w-[200px] h-[300px]'
                          : 'w-full aspect-[2/3]'
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
                <div className="relative h-full w-full overflow-hidden rounded-lg bg-zinc-900">
                    <PosterTransition type={itemType} id={itemId} className="absolute inset-0">
                        <Image
                            src={getContentPosterUrl(item.poster_path)}
                            alt={title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 200px"
                        />
                    </PosterTransition>

                    {!isTouch && (
                        <button
                            type="button"
                            className={`absolute inset-0 z-10 flex items-center justify-center bg-black/45 transition-opacity duration-300 ease-out ${
                                isExpanded
                                    ? 'opacity-0 pointer-events-none'
                                    : 'opacity-0 group-hover:opacity-100'
                            }`}
                            onClick={(e) => {
                                e.stopPropagation()
                                onPlay?.(itemId, itemType)
                            }}
                            aria-label={`Guarda ${title}`}
                        >
                            <span
                                className={`rounded-full bg-white text-black flex items-center justify-center shadow-lg scale-90 group-hover:scale-100 transition-transform duration-300 ease-out ${
                                    variant === 'top10' ? 'w-11 h-11' : 'w-12 h-12'
                                }`}
                            >
                                <Play className="w-5 h-5 fill-current ml-0.5" />
                            </span>
                        </button>
                    )}

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
