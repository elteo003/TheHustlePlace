'use client'

import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Play, Info, Volume2, VolumeX } from 'lucide-react'
import Image from 'next/image'
import { ContentType, getContentId } from '@/lib/content-navigation'
import { ContentItem, getContentPosterUrl, getContentTitle, resolveContentType } from '@/lib/content-display'
import { useTrailerPreview, buildTrailerEmbedUrl } from '@/hooks/useTrailerPreview'
import { useReducedMotion } from '@/hooks/useMediaQuery'
import { dockEase } from '@/lib/motion'
import { shouldDismissSheet } from '@/lib/sheet-gesture'
import { Spinner } from '@/components/ui/spinner'
import { DetailLink } from '@/components/ui/detail-link'

interface TrailerDockProps {
    item: ContentItem | null
    type?: ContentType
    onClose: () => void
    onPlay?: (id: number, type?: ContentType) => void
    onDetails?: (id: number, type?: ContentType) => void
}

export function TrailerDock({
    item,
    type = 'movie',
    onClose,
    onPlay,
    onDetails,
}: TrailerDockProps) {
    const reduceMotion = useReducedMotion()
    const itemType = item ? resolveContentType(item, type) : type
    const itemId = item ? getContentId(item) : 0
    const title = item ? getContentTitle(item, itemType) : ''
    const poster = item ? getContentPosterUrl(item.backdrop_path || item.poster_path, 'original') : ''

    const { trailerKey, isLoading, scheduleTrailerLoad, resetPreview } = useTrailerPreview(
        itemId,
        itemType,
        0
    )
    const [muted, setMuted] = useState(true)
    const [ready, setReady] = useState(false)
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const handleStartY = useRef(0)
    const handleStartAt = useRef(0)
    const [pullY, setPullY] = useState(0)
    const [pulling, setPulling] = useState(false)

    const kickPlayback = () => {
        const frame = iframeRef.current?.contentWindow
        if (!frame) return
        ;['mute', 'playVideo'].forEach((func) => {
            frame.postMessage(
                JSON.stringify({ event: 'command', func, args: [] }),
                'https://www.youtube.com'
            )
        })
    }

    useEffect(() => {
        setMuted(true)
        setReady(false)
        setPullY(0)
        setPulling(false)
        if (!item) {
            resetPreview()
            return
        }
        scheduleTrailerLoad()
    }, [itemId, itemType, item, resetPreview, scheduleTrailerLoad])

    const onHandlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
        if (reduceMotion) return
        handleStartY.current = event.clientY
        handleStartAt.current = event.timeStamp
        setPulling(true)
        event.currentTarget.setPointerCapture(event.pointerId)
    }

    const onHandlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
        setPullY(Math.max(0, event.clientY - handleStartY.current))
    }

    const endHandlePull = (event: PointerEvent<HTMLDivElement>) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
        event.currentTarget.releasePointerCapture(event.pointerId)
        const offsetY = event.clientY - handleStartY.current
        const velocityY = (offsetY / Math.max(event.timeStamp - handleStartAt.current, 1)) * 1000
        setPulling(false)
        setPullY(0)
        if (shouldDismissSheet(offsetY, velocityY)) {
            onClose()
        }
    }

    const embedUrl = trailerKey ? buildTrailerEmbedUrl(trailerKey, muted) : null
    const enter = reduceMotion
        ? { duration: 0.15, ease: 'easeOut' as const }
        : { duration: 0.22, ease: dockEase }
    const exit = reduceMotion
        ? { duration: 0.1 }
        : { duration: 0.16, ease: dockEase }

    return (
        <AnimatePresence>
            {item && (
                <motion.section
                    key="sottocinema"
                    aria-label={`Anteprima trailer ${title}`}
                    className="relative mt-3 overflow-hidden rounded-2xl bg-zinc-950 ring-1 ring-white/10"
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
                    animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: pullY }}
                    exit={
                        reduceMotion
                            ? { opacity: 0, transition: exit }
                            : { opacity: 0, y: 12, transition: exit }
                    }
                    transition={pulling ? { duration: 0 } : enter}
                >
                    <div
                        className="flex touch-none items-center justify-center py-3"
                        onPointerDown={onHandlePointerDown}
                        onPointerMove={onHandlePointerMove}
                        onPointerUp={endHandlePull}
                        onPointerCancel={endHandlePull}
                    >
                        <div className="h-1 w-10 rounded-full bg-white/25" aria-hidden />
                    </div>

                    <div className="relative aspect-video overflow-hidden bg-zinc-900">
                        {poster && (
                            <Image
                                src={poster}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="100vw"
                                style={{ opacity: ready ? 0 : 1 }}
                            />
                        )}
                        {embedUrl && (
                            <iframe
                                ref={iframeRef}
                                key={`${trailerKey}-${muted ? 'm' : 'u'}`}
                                src={embedUrl}
                                title={`Trailer ${title}`}
                                className={`pointer-events-none absolute inset-0 h-full w-full border-0 transition-opacity duration-300 ease-out ${
                                    ready ? 'opacity-100' : 'opacity-0'
                                }`}
                                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                                onLoad={() => {
                                    setReady(true)
                                    kickPlayback()
                                }}
                            />
                        )}
                        {isLoading && !ready && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                <Spinner size="sm" />
                            </div>
                        )}

                        <button
                            type="button"
                            className="absolute bottom-3 right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white ring-1 ring-white/20"
                            onPointerDown={(event) => event.stopPropagation()}
                            onClick={() => setMuted((value) => !value)}
                            aria-label={muted ? 'Attiva audio' : 'Disattiva audio'}
                        >
                            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </button>
                    </div>

                    <div className="flex items-center gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-white">{title}</p>
                            <p className="text-[11px] text-white/45">Trascina la barretta per chiudere</p>
                        </div>
                        {onPlay && (
                            <button
                                type="button"
                                onPointerDown={(event) => event.stopPropagation()}
                                onClick={() => onPlay(itemId, itemType)}
                                className="btn-play flex items-center gap-1.5 px-4 py-2 text-sm"
                            >
                                <Play className="h-3.5 w-3.5 fill-current" />
                                Guarda
                            </button>
                        )}
                        {onDetails && (
                            <DetailLink
                                id={itemId}
                                type={itemType}
                                className="btn-ghost-outline px-3 py-2 text-sm inline-flex items-center gap-1"
                                onClick={(event) => {
                                    event.stopPropagation()
                                    onDetails(itemId, itemType)
                                }}
                                onPointerDown={(event) => event.stopPropagation()}
                            >
                                <Info className="h-3.5 w-3.5" />
                            </DetailLink>
                        )}
                    </div>
                </motion.section>
            )}
        </AnimatePresence>
    )
}
