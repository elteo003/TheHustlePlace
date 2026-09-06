'use client'

import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Play, Info, Volume2, VolumeX } from 'lucide-react'
import Image from 'next/image'
import { ContentType, getContentId } from '@/lib/content-navigation'
import { ContentItem, getContentPosterUrl, getContentTitle, resolveContentType } from '@/lib/content-display'
import { useTrailerPreview, buildTrailerEmbedUrl } from '@/hooks/useTrailerPreview'
import { useReducedMotion } from '@/hooks/useMediaQuery'
import { sheetEase } from '@/lib/motion'
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

function readPosterOrigin(itemId: number) {
    if (typeof document === 'undefined') {
        return { x: 0, y: 96, scale: 0.72 }
    }
    const node = document.querySelector(`[data-trailer-origin="${itemId}"]`)
    if (!(node instanceof HTMLElement)) {
        return { x: 0, y: 96, scale: 0.72 }
    }
    const rect = node.getBoundingClientRect()
    const scale = Math.min(rect.width / window.innerWidth, rect.height / window.innerHeight)
    return {
        x: rect.left + rect.width / 2 - window.innerWidth / 2,
        y: rect.top + rect.height / 2 - window.innerHeight / 2,
        scale: Math.min(0.88, Math.max(0.22, scale)),
    }
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
    const [portalReady, setPortalReady] = useState(false)
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const sheetRef = useRef<HTMLDivElement>(null)
    const handleStartY = useRef(0)
    const handleStartAt = useRef(0)
    const origin = useMemo(
        () => (item ? readPosterOrigin(itemId) : { x: 0, y: 96, scale: 0.72 }),
        [item, itemId]
    )
    const originRef = useRef(origin)
    originRef.current = origin

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
        setPortalReady(true)
    }, [])

    useEffect(() => {
        setMuted(true)
        setReady(false)
        if (sheetRef.current) {
            sheetRef.current.style.transform = ''
            sheetRef.current.style.transition = ''
        }
        if (!item) {
            resetPreview()
            return
        }
        scheduleTrailerLoad()
    }, [itemId, itemType, item, resetPreview, scheduleTrailerLoad])

    useEffect(() => {
        if (!item) return
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKey)
        return () => {
            document.body.style.overflow = previousOverflow
            window.removeEventListener('keydown', onKey)
        }
    }, [item, onClose])

    const onHandlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
        if (reduceMotion) return
        handleStartY.current = event.clientY
        handleStartAt.current = event.timeStamp
        event.currentTarget.setPointerCapture(event.pointerId)
        if (sheetRef.current) {
            sheetRef.current.style.transition = 'none'
        }
    }

    const onHandlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId) || !sheetRef.current) return
        const dy = Math.max(0, event.clientY - handleStartY.current)
        sheetRef.current.style.transform = `translate3d(0, ${dy}px, 0)`
    }

    const endHandlePull = (event: PointerEvent<HTMLDivElement>) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
        event.currentTarget.releasePointerCapture(event.pointerId)
        const offsetY = event.clientY - handleStartY.current
        const velocityY = (offsetY / Math.max(event.timeStamp - handleStartAt.current, 1)) * 1000
        if (shouldDismissSheet(offsetY, velocityY)) {
            onClose()
            return
        }
        if (sheetRef.current) {
            sheetRef.current.style.transition = 'transform 0.2s cubic-bezier(0.32, 0.72, 0, 1)'
            sheetRef.current.style.transform = 'translate3d(0, 0, 0)'
        }
    }

    const embedUrl = trailerKey ? buildTrailerEmbedUrl(trailerKey, muted) : null
    const travel = reduceMotion
        ? { duration: 0.16, ease: 'easeOut' as const }
        : { duration: 0.44, ease: sheetEase }
    const leave = reduceMotion
        ? { duration: 0.12 }
        : { duration: 0.28, ease: sheetEase }

    const overlay = (
        <AnimatePresence>
            {item && (
                <motion.section
                    key={`sottocinema-${itemId}`}
                    aria-modal="true"
                    aria-label={`Anteprima trailer ${title}`}
                    className="fixed inset-0 z-[92] h-dvh w-screen overflow-hidden bg-black overscroll-none"
                    initial={
                        reduceMotion
                            ? { opacity: 0 }
                            : {
                                  opacity: 0.7,
                                  x: origin.x,
                                  y: origin.y,
                                  scale: origin.scale,
                                  borderRadius: 12,
                              }
                    }
                    animate={{ opacity: 1, x: 0, y: 0, scale: 1, borderRadius: 0 }}
                    exit={
                        reduceMotion
                            ? { opacity: 0, transition: leave }
                            : {
                                  opacity: 0.45,
                                  x: originRef.current.x,
                                  y: originRef.current.y,
                                  scale: originRef.current.scale,
                                  borderRadius: 12,
                                  transition: leave,
                              }
                    }
                    transition={travel}
                >
                    <div ref={sheetRef} className="relative h-full w-full bg-black">
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
                                className={`pointer-events-none border-0 transition-opacity duration-300 ease-out ${
                                    ready ? 'opacity-100' : 'opacity-0'
                                }`}
                                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                                onLoad={() => {
                                    setReady(true)
                                    kickPlayback()
                                }}
                                style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    width: 'max(100vw, 177.78dvh)',
                                    height: 'max(100dvh, 56.25vw)',
                                    transform: 'translate(-50%, -50%) scale(1.08)',
                                }}
                            />
                        )}
                        {isLoading && !ready && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                <Spinner size="sm" />
                            </div>
                        )}

                        <div
                            className="absolute inset-x-0 top-0 z-10 flex touch-none items-center justify-center pb-4 pt-[max(0.85rem,env(safe-area-inset-top))]"
                            onPointerDown={onHandlePointerDown}
                            onPointerMove={onHandlePointerMove}
                            onPointerUp={endHandlePull}
                            onPointerCancel={endHandlePull}
                        >
                            <div className="h-1 w-10 rounded-full bg-white/35" aria-hidden />
                        </div>

                        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black via-black/55 to-transparent pt-24">
                            <div className="pointer-events-auto flex items-end gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-base font-semibold text-white">{title}</p>
                                    <p className="text-[11px] text-white/45">Trascina la barretta per chiudere</p>
                                </div>
                                <button
                                    type="button"
                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black/55 text-white ring-1 ring-white/20"
                                    onClick={() => setMuted((value) => !value)}
                                    aria-label={muted ? 'Attiva audio' : 'Disattiva audio'}
                                >
                                    {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                                </button>
                                {onPlay && (
                                    <button
                                        type="button"
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
                                        className="btn-ghost-outline inline-flex items-center gap-1 px-3 py-2 text-sm"
                                        onClick={(event) => {
                                            event.stopPropagation()
                                            onDetails(itemId, itemType)
                                        }}
                                    >
                                        <Info className="h-3.5 w-3.5" />
                                    </DetailLink>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.section>
            )}
        </AnimatePresence>
    )

    if (!portalReady) return null
    return createPortal(overlay, document.body)
}
