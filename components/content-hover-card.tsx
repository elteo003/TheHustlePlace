'use client'

import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { Play, Info, Star, Volume2, VolumeX } from 'lucide-react'
import { PlayMark } from '@/components/ui/play-mark'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { ContentType, getContentId } from '@/lib/content-navigation'
import { ContentItem, getContentPosterUrl, getContentTitle, resolveContentType, formatUpcomingReleaseDate } from '@/lib/content-display'
import { buildTrailerEmbedUrl, prefetchTrailerKey, useTrailerPreview } from '@/hooks/useTrailerPreview'
import { useYouTubeCurtain, YOUTUBE_DISSOLVE_EASE, YOUTUBE_DISSOLVE_MS } from '@/hooks/useYouTubeCurtain'
import { postYouTubeCommand } from '@/lib/youtube-command'
import { useIsCoarsePointer, useReducedMotion } from '@/hooks/useMediaQuery'
import { ContentActionSheet } from '@/components/ui/content-action-sheet'
import { PosterTransition } from '@/components/ui/poster-transition'
import { DetailLink } from '@/components/ui/detail-link'
import { Spinner } from '@/components/ui/spinner'
import { Movie, TVShow } from '@/types'

const EXPAND_DELAY_MS = 1000
const CLOSE_ARM_MS = 400
const UPCOMING_TEXT_ENTER_MS = 300
const UPCOMING_TRAILER_DELAY_MS = 1500
const UPCOMING_TOTAL_DELAY_MS = UPCOMING_TEXT_ENTER_MS + UPCOMING_TRAILER_DELAY_MS

interface ContentHoverCardProps {
    item: ContentItem
    type?: ContentType
    isExpanded: boolean
    onExpand: () => void
    onCollapse: () => void
    onPeek?: () => void
    isPeeking?: boolean
    onPlay?: (id: number, type?: ContentType) => void
    onDetails?: (id: number, type?: ContentType) => void
    variant?: 'carousel' | 'grid' | 'top10'
    watchable?: boolean
    isUpcomingSection?: boolean
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
    onPeek,
    isPeeking = false,
    onPlay,
    onDetails,
    variant = 'carousel',
    watchable = true,
    isUpcomingSection = false,
}: ContentHoverCardProps) {
    const isTouch = useIsCoarsePointer()
    const reduceMotion = useReducedMotion()
    const cardRef = useRef<HTMLDivElement>(null)
    const [originRect, setOriginRect] = useState<{
        x: number
        y: number
        width: number
        height: number
    } | null>(null)
    const expandTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const expandedRef = useRef(false)
    const closeArmed = useRef(false)
    const [isHovered, setIsHovered] = useState(false)
    const [sheetOpen, setSheetOpen] = useState(false)
    const [portalReady, setPortalReady] = useState(false)
    const [trailerMuted, setTrailerMuted] = useState(true)
    const iframeRef = useRef<HTMLIFrameElement>(null)

    const itemType = resolveContentType(item, type)
    const itemId = getContentId(item)
    const title = getContentTitle(item, itemType)
    const year = getYear(item, itemType)
    const rating = item.vote_average > 0 ? item.vote_average.toFixed(1) : null
    const previewImage = getContentPosterUrl(item.backdrop_path || item.poster_path, 'original')
    const canWatch = watchable && Boolean(onPlay)

    const rawReleaseDate = itemType === 'tv' ? (item as TVShow).first_air_date : (item as Movie).release_date
    const upcomingInfo = isUpcomingSection ? formatUpcomingReleaseDate(rawReleaseDate) : null

    const { trailerKey, isLoading, scheduleTrailerLoad, resetPreview } = useTrailerPreview(
        itemId,
        itemType,
        400
    )
    const trailerUrl = trailerKey ? buildTrailerEmbedUrl(trailerKey, true) : null
    const { revealed, kickPlayback } = useYouTubeCurtain(iframeRef, {
        enabled: isExpanded && Boolean(trailerUrl),
        muted: trailerMuted,
        loop: true,
    })

    const toggleAudio = () => {
        const nextMuted = !trailerMuted
        setTrailerMuted(nextMuted)
        postYouTubeCommand(iframeRef.current?.contentWindow, nextMuted ? 'mute' : 'unMute')
        if (!nextMuted) {
            postYouTubeCommand(iframeRef.current?.contentWindow, 'setVolume', [100])
        }
    }

    expandedRef.current = isExpanded

    const closeNow = () => {
        if (expandTimer.current) {
            clearTimeout(expandTimer.current)
            expandTimer.current = null
        }
        closeArmed.current = false
        setIsHovered(false)
        onCollapse()
    }

    const handlePreviewExit = () => {
        if (expandedRef.current) return
        setTrailerMuted(true)
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
        setIsHovered(false)
        if (expandTimer.current) {
            clearTimeout(expandTimer.current)
            expandTimer.current = null
        }
    }

    const handlePreviewMouseLeave = () => {
        if (!closeArmed.current) return
        closeNow()
    }

    const captureOriginRect = () => {
        if (cardRef.current) {
            const rect = cardRef.current.getBoundingClientRect()
            setOriginRect({
                x: rect.left,
                y: rect.top,
                width: rect.width,
                height: rect.height,
            })
        }
    }

    const handleMouseEnter = () => {
        if (isTouch) return
        captureOriginRect()
        setIsHovered(true)
        if (expandTimer.current) clearTimeout(expandTimer.current)
        const delay = isUpcomingSection && upcomingInfo ? UPCOMING_TOTAL_DELAY_MS : EXPAND_DELAY_MS
        expandTimer.current = setTimeout(() => {
            captureOriginRect()
            onExpand()
            scheduleTrailerLoad()
        }, delay)
    }

    const handleTap = () => {
        if (!canWatch && onDetails) {
            onDetails(itemId, itemType)
            return
        }
        if (isTouch) {
            if (onPeek) {
                void prefetchTrailerKey(itemId, itemType)
                onPeek()
                return
            }
            setSheetOpen(true)
            return
        }
        captureOriginRect()
        onExpand()
        scheduleTrailerLoad()
    }

    const getMorphParams = () => {
        if (!originRect || typeof window === 'undefined') {
            return { deltaX: 0, deltaY: 0, scale: 0.96 }
        }
        const vw = window.innerWidth
        const vh = window.innerHeight
        const maxWFromVw = vw * 0.96
        const maxWFromVh = (vh - 64) * (16 / 9)
        const targetWidth = Math.min(maxWFromVw, maxWFromVh)
        const posterCenterX = originRect.x + originRect.width / 2
        const posterCenterY = originRect.y + originRect.height / 2
        const deltaX = Math.round(posterCenterX - vw / 2)
        const deltaY = Math.round(posterCenterY - vh / 2)
        const scale = targetWidth > 0 ? Math.max(0.08, originRect.width / targetWidth) : 0.96
        return { deltaX, deltaY, scale }
    }

    const morph = getMorphParams()

    const cardTransition = reduceMotion
        ? { duration: 0 }
        : {
              x: { duration: 0.42, ease: [0.16, 1, 0.3, 1] },
              y: { duration: 0.42, ease: [0.16, 1, 0.3, 1] },
              scale: { duration: 0.42, ease: [0.16, 1, 0.3, 1] },
              opacity: { duration: 0.22, ease: 'easeOut' },
          }

    const cardExit = reduceMotion
        ? { duration: 0 }
        : {
              x: { duration: 0.28, ease: [0.25, 1, 0.5, 1] },
              y: { duration: 0.28, ease: [0.25, 1, 0.5, 1] },
              scale: { duration: 0.28, ease: [0.25, 1, 0.5, 1] },
              opacity: { duration: 0.22, ease: 'easeIn' },
          }

    const dimTransition = reduceMotion
        ? { duration: 0 }
        : { duration: 0.35, ease: 'easeOut' }

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
                    transition={dimTransition}
                    className="fixed inset-0 z-[90] bg-black/70"
                    onClick={closeNow}
                />
            )}
            {isExpanded && !isTouch && (
                <motion.div
                    key="preview-wrapper"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 1 }}
                    className="fixed inset-0 z-[91] pointer-events-none flex items-center justify-center p-4"
                >
                    <motion.div
                        key="preview-card"
                        role="dialog"
                        aria-label={title}
                        initial={{
                            opacity: 0,
                            x: morph.deltaX,
                            y: morph.deltaY,
                            scale: morph.scale,
                        }}
                        animate={{
                            opacity: 1,
                            x: 0,
                            y: 0,
                            scale: 1,
                            transition: cardTransition,
                        }}
                        exit={{
                            opacity: 0,
                            x: morph.deltaX,
                            y: morph.deltaY,
                            scale: morph.scale,
                            transition: cardExit,
                        }}
                        className="pointer-events-auto relative w-[min(96vw,calc((100vh-4rem)*16/9))] overflow-hidden rounded-2xl bg-black shadow-[0_32px_120px_rgba(0,0,0,0.75)] ring-1 ring-white/10 will-change-transform"
                        onMouseLeave={handlePreviewMouseLeave}
                        onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
                    >
                    <div className="relative aspect-video overflow-hidden bg-zinc-900">
                        <Image
                            src={previewImage}
                            alt=""
                            fill
                            className="z-[3] object-cover"
                            sizes="96vw"
                            style={{
                                opacity: revealed ? 0 : 1,
                                transition:
                                    revealed && !reduceMotion
                                        ? `opacity ${YOUTUBE_DISSOLVE_MS}ms ${YOUTUBE_DISSOLVE_EASE}`
                                        : 'none',
                            }}
                        />
                        {trailerUrl && (
                            <iframe
                                ref={iframeRef}
                                key={trailerKey}
                                src={trailerUrl}
                                className="pointer-events-none"
                                tabIndex={-1}
                                allow="autoplay; encrypted-media"
                                title={`Trailer ${title}`}
                                onLoad={kickPlayback}
                                style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    zIndex: 1,
                                    width: '100%',
                                    height: '100%',
                                    transform: 'translate(-50%, -50%) scale(1.12)',
                                    border: 0,
                                }}
                            />
                        )}
                        {isLoading && !trailerKey && (
                            <div className="absolute inset-0 z-[4] flex items-center justify-center bg-black/40">
                                <Spinner size="sm" />
                            </div>
                        )}
                        {trailerKey && (
                            <button
                                type="button"
                                className="absolute top-3 right-3 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white ring-1 ring-white/20"
                                onClick={toggleAudio}
                                aria-label={trailerMuted ? 'Attiva audio' : 'Disattiva audio'}
                            >
                                {trailerMuted ? (
                                    <VolumeX className="h-4 w-4" />
                                ) : (
                                    <Volume2 className="h-4 w-4" />
                                )}
                            </button>
                        )}

                            <div className="pointer-events-none absolute inset-0 z-[4] bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                            <div className="absolute bottom-0 left-0 right-0 z-10 p-5">
                                <h3 className="text-white font-semibold text-xl leading-snug line-clamp-1">
                                    {title}
                                </h3>
                                {(upcomingInfo || year || rating) && (
                                    <p className="mt-1 flex items-center gap-2 text-sm text-white/60">
                                        {isUpcomingSection && upcomingInfo ? (
                                            <span className="text-white font-medium">
                                                In arrivo il {upcomingInfo.day} {upcomingInfo.monthName}{!upcomingInfo.isCurrentYear ? ` ${upcomingInfo.year}` : ''}
                                            </span>
                                        ) : (
                                            year && <span>{year}</span>
                                        )}
                                        {((isUpcomingSection && upcomingInfo) || year) && rating && <span className="text-white/25">·</span>}
                                        {rating && (
                                            <span className="inline-flex items-center gap-1.5">
                                                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                                {rating}
                                            </span>
                                        )}
                                    </p>
                                )}
                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                    {canWatch && onPlay && (
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
                                            watchable={canWatch}
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
                </motion.div>
            )}
        </AnimatePresence>
    )

    return (
        <>
            <div
                ref={cardRef}
                className={`group relative flex-shrink-0 hover:z-20 ${
                    variant === 'top10'
                        ? 'z-10 w-[clamp(7.5rem,8vw,12.5rem)] aspect-[2/3]'
                        : variant === 'carousel'
                          ? 'poster-tile aspect-[2/3]'
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
                data-trailer-origin={itemId}
            >
                <div
                    className={`relative h-full w-full overflow-hidden rounded-lg bg-zinc-900 ${
                        isPeeking ? 'opacity-0' : ''
                    }`}
                >
                    <PosterTransition type={itemType} id={itemId} className="absolute inset-0">
                        <Image
                            src={getContentPosterUrl(item.poster_path)}
                            alt={title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 40vw, (max-width: 1536px) 200px, 280px"
                        />
                    </PosterTransition>

                    {isUpcomingSection && upcomingInfo && (
                        <div
                            className={`pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center p-3 text-center transition-all duration-300 ease-out select-none ${
                                isHovered && !isExpanded
                                    ? 'opacity-100 bg-black/75 backdrop-blur-[2px]'
                                    : 'opacity-0 bg-black/0'
                            }`}
                        >
                            <div
                                className={`flex flex-col items-center transition-transform duration-300 ease-out ${
                                    isHovered && !isExpanded
                                        ? 'translate-y-0 scale-100'
                                        : 'translate-y-2 scale-95'
                                }`}
                            >
                                <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-white uppercase">
                                    In arrivo il
                                </span>
                                <span className="mt-1 text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-none drop-shadow-md">
                                    {upcomingInfo.day}
                                </span>
                                <span className="mt-1 text-xs sm:text-sm font-bold tracking-wider uppercase text-white/90">
                                    {upcomingInfo.monthName}
                                </span>
                                {!upcomingInfo.isCurrentYear && (
                                    <span className="mt-1 text-[11px] font-semibold tracking-widest text-white/60">
                                        {upcomingInfo.year}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {!isTouch && canWatch && (
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
                            <PlayMark
                                className={`scale-90 group-hover:scale-100 transition-transform duration-300 ease-out ${
                                    variant === 'top10' ? 'w-11 h-11' : 'w-12 h-12'
                                }`}
                            />
                        </button>
                    )}

                    {isTouch && canWatch && onPlay && (
                        <button
                            type="button"
                            className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
                            onClick={(e) => {
                                e.stopPropagation()
                                onPlay(itemId, itemType)
                            }}
                            aria-label={`Guarda ${title}`}
                        >
                            <PlayMark pulse className="h-12 w-12" iconClassName="h-5 w-5" />
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
                onPlay={canWatch && onPlay ? () => onPlay(itemId, itemType) : undefined}
                onDetails={() => onDetails?.(itemId, itemType)}
            />
        </>
    )
}
