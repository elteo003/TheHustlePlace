'use client'

import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { Play, Info, Volume2, VolumeX } from 'lucide-react'
import Image from 'next/image'
import { ContentType, getContentId } from '@/lib/content-navigation'
import { ContentItem, getContentPosterUrl, getContentTitle, resolveContentType } from '@/lib/content-display'
import { useTrailerPreview, buildTrailerEmbedUrl } from '@/hooks/useTrailerPreview'
import { useReducedMotion } from '@/hooks/useMediaQuery'
import { shouldDismissSheet } from '@/lib/sheet-gesture'
import { postYouTubeCommand, startYouTubePreview } from '@/lib/youtube-command'
import { Spinner } from '@/components/ui/spinner'
import { DetailLink } from '@/components/ui/detail-link'

interface TrailerDockProps {
    item: ContentItem | null
    type?: ContentType
    onClose: () => void
    onExited?: () => void
    onPlay?: (id: number, type?: ContentType) => void
    onDetails?: (id: number, type?: ContentType) => void
}

const VAUL = 'cubic-bezier(0.32, 0.72, 0, 1)'
const EASE_OPACITY = 'cubic-bezier(0.25, 0.1, 0.25, 1)'
const ENTER_MS = 360
const EXIT_MS = 240
const FADE_MS = 200
const SNAP_MS = 200

type PosterOrigin = {
    width: number
    height: number
    startTransform: string
    endTransform: string
}

function readPosterOrigin(itemId: number): PosterOrigin {
    const vw = typeof window === 'undefined' ? 390 : window.innerWidth
    const vh = typeof window === 'undefined' ? 844 : window.innerHeight
    const node = typeof document === 'undefined'
        ? null
        : document.querySelector(`[data-trailer-origin="${itemId}"]`)
    const rect =
        node instanceof HTMLElement
            ? node.getBoundingClientRect()
            : { left: vw / 2 - 60, top: vh * 0.28, width: 120, height: 180 }
    const coverScale = Math.max(vw / rect.width, vh / rect.height)
    return {
        width: rect.width,
        height: rect.height,
        startTransform: `translate3d(${rect.left}px, ${rect.top}px, 0) scale(1)`,
        endTransform: `translate3d(${(vw - rect.width * coverScale) / 2}px, ${
            (vh - rect.height * coverScale) / 2
        }px, 0) scale(${coverScale})`,
    }
}

function play(el: HTMLElement | null, keyframes: Keyframe[], duration: number, easing: string) {
    if (!el) return Promise.resolve()
    el.getAnimations().forEach((animation) => animation.cancel())
    return el
        .animate(keyframes, { duration, easing, fill: 'forwards' })
        .finished.then(() => undefined)
        .catch(() => undefined)
}

export function TrailerDock({
    item,
    type = 'movie',
    onClose,
    onExited,
    onPlay,
    onDetails,
}: TrailerDockProps) {
    const [portalReady, setPortalReady] = useState(false)
    const [shown, setShown] = useState<ContentItem | null>(item)
    const onExitedRef = useRef(onExited)
    onExitedRef.current = onExited

    const finishExit = useCallback(() => {
        setShown(null)
        onExitedRef.current?.()
    }, [])

    useEffect(() => {
        setPortalReady(true)
    }, [])

    useEffect(() => {
        if (item) setShown(item)
    }, [item])

    if (!portalReady || !shown) return null

    return createPortal(
        <TrailerStage
            key={getContentId(shown)}
            item={shown}
            type={type}
            leaving={!item}
            onClose={onClose}
            onExited={finishExit}
            onPlay={onPlay}
            onDetails={onDetails}
        />,
        document.body
    )
}

function TrailerStage({
    item,
    type,
    onClose,
    leaving,
    onExited,
    onPlay,
    onDetails,
}: {
    item: ContentItem
    type: ContentType
    onClose: () => void
    leaving: boolean
    onExited?: () => void
    onPlay?: (id: number, type?: ContentType) => void
    onDetails?: (id: number, type?: ContentType) => void
}) {
    const reduceMotion = useReducedMotion()
    const itemType = resolveContentType(item, type)
    const itemId = getContentId(item)
    const title = getContentTitle(item, itemType)
    const cardPoster = getContentPosterUrl(item.poster_path)

    const { trailerKey, isLoading, scheduleTrailerLoad, resetPreview } = useTrailerPreview(
        itemId,
        itemType,
        0
    )
    const [muted, setMuted] = useState(true)
    const mutedRef = useRef(true)
    mutedRef.current = muted
    const [ready, setReady] = useState(false)
    const [open, setOpen] = useState(reduceMotion)
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const backdropRef = useRef<HTMLDivElement>(null)
    const sheetRef = useRef<HTMLDivElement>(null)
    const posterRef = useRef<HTMLDivElement>(null)
    const videoRef = useRef<HTMLDivElement>(null)
    const chromeRef = useRef<HTMLDivElement>(null)
    const handleStartY = useRef(0)
    const handleStartAt = useRef(0)
    const pullY = useRef(0)
    const exitViaPull = useRef(false)
    const originRef = useRef<PosterOrigin>(readPosterOrigin(itemId))
    const onCloseRef = useRef(onClose)
    const openRef = useRef(open)
    onCloseRef.current = onClose
    openRef.current = open

    const kickPlayback = () => {
        startYouTubePreview(iframeRef.current?.contentWindow, mutedRef.current)
    }

    const toggleAudio = () => {
        const nextMuted = !muted
        setMuted(nextMuted)
        postYouTubeCommand(iframeRef.current?.contentWindow, nextMuted ? 'mute' : 'unMute')
        if (!nextMuted) {
            postYouTubeCommand(iframeRef.current?.contentWindow, 'setVolume', [100])
        }
    }

    useEffect(() => {
        originRef.current = readPosterOrigin(itemId)
        const origin = originRef.current
        const poster = posterRef.current
        if (poster) {
            poster.style.width = `${origin.width}px`
            poster.style.height = `${origin.height}px`
            poster.style.transform = origin.startTransform
            poster.style.borderRadius = '8px'
        }
        scheduleTrailerLoad()

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onCloseRef.current()
        }
        window.addEventListener('keydown', onKey)

        let cancelled = false
        if (reduceMotion) {
            if (backdropRef.current) backdropRef.current.style.opacity = '1'
            if (poster) {
                poster.style.transform = origin.endTransform
                poster.style.borderRadius = '0px'
            }
            setOpen(true)
        } else {
            void play(backdropRef.current, [{ opacity: 0 }, { opacity: 1 }], FADE_MS, EASE_OPACITY)
            void play(
                poster,
                [
                    { transform: origin.startTransform, borderRadius: '8px' },
                    { transform: origin.endTransform, borderRadius: '0px' },
                ],
                ENTER_MS,
                VAUL
            ).then(() => {
                if (!cancelled) setOpen(true)
            })
        }

        return () => {
            cancelled = true
            document.body.style.overflow = previousOverflow
            window.removeEventListener('keydown', onKey)
            resetPreview()
        }
    }, [itemId, reduceMotion, scheduleTrailerLoad, resetPreview])

    useEffect(() => {
        if (!leaving) return
        if (exitViaPull.current) {
            onExited?.()
            return
        }

        const origin = originRef.current
        const fadeOut = openRef.current
            ? [
                  play(videoRef.current, [{ opacity: 1 }, { opacity: 0 }], 120, EASE_OPACITY),
                  play(chromeRef.current, [{ opacity: 1 }, { opacity: 0 }], 120, EASE_OPACITY),
              ]
            : []

        const finish = reduceMotion
            ? play(backdropRef.current, [{ opacity: 1 }, { opacity: 0 }], 120, EASE_OPACITY)
            : Promise.all([
                  ...fadeOut,
                  play(
                      posterRef.current,
                      [
                          { transform: origin.endTransform, borderRadius: '0px' },
                          { transform: origin.startTransform, borderRadius: '8px' },
                      ],
                      EXIT_MS,
                      VAUL
                  ),
                  play(backdropRef.current, [{ opacity: 1 }, { opacity: 0 }], EXIT_MS, EASE_OPACITY),
              ])

        void finish.then(() => onExited?.())
    }, [leaving, reduceMotion, onExited])

    const setSheetY = (y: number, withTransition: boolean) => {
        const sheet = sheetRef.current
        if (!sheet) return
        pullY.current = y
        sheet.style.transition = withTransition ? `transform ${SNAP_MS}ms ${VAUL}` : 'none'
        sheet.style.transform = `translate3d(0, ${y}px, 0)`
    }

    const onHandlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
        if (reduceMotion) return
        handleStartY.current = event.clientY
        handleStartAt.current = event.timeStamp
        event.currentTarget.setPointerCapture(event.pointerId)
        setSheetY(pullY.current, false)
    }

    const onHandlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
        setSheetY(Math.max(0, event.clientY - handleStartY.current), false)
    }

    const endHandlePull = (event: PointerEvent<HTMLDivElement>) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
        event.currentTarget.releasePointerCapture(event.pointerId)
        const offsetY = pullY.current
        const velocityY = (offsetY / Math.max(event.timeStamp - handleStartAt.current, 1)) * 1000
        if (!shouldDismissSheet(offsetY, velocityY)) {
            setSheetY(0, true)
            return
        }

        exitViaPull.current = true
        const end = window.innerHeight
        const duration = Math.min(320, Math.max(160, 280 - velocityY / 12))
        void Promise.all([
            play(
                sheetRef.current,
                [
                    { transform: `translate3d(0, ${offsetY}px, 0)` },
                    { transform: `translate3d(0, ${end}px, 0)` },
                ],
                duration,
                VAUL
            ),
            play(backdropRef.current, [{ opacity: 1 }, { opacity: 0 }], duration, EASE_OPACITY),
        ]).then(() => onClose())
    }

    const embedUrl = trailerKey ? buildTrailerEmbedUrl(trailerKey, true) : null
    const origin = originRef.current
    const showVideo = open && ready

    return (
        <section
            aria-modal="true"
            aria-label={`Anteprima trailer ${title}`}
            className="fixed inset-0 z-[92] h-dvh w-screen overflow-hidden overscroll-none"
        >
            <div ref={backdropRef} className="absolute inset-0 bg-black" style={{ opacity: 0 }} />

            <div ref={sheetRef} className="absolute inset-0">
                <div
                    ref={posterRef}
                    className="absolute left-0 top-0 overflow-hidden bg-zinc-900"
                    style={{
                        width: origin.width,
                        height: origin.height,
                        transformOrigin: '0 0',
                        transform: origin.startTransform,
                        borderRadius: 8,
                    }}
                >
                    <Image
                        src={cardPoster}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="50vw"
                        priority
                    />
                </div>

                <div
                    ref={videoRef}
                    className="absolute inset-0"
                    style={{
                        opacity: showVideo ? 1 : 0,
                        transition: `opacity ${FADE_MS}ms ${EASE_OPACITY}`,
                    }}
                >
                    {embedUrl && (
                        <iframe
                            ref={iframeRef}
                            key={trailerKey}
                            src={embedUrl}
                            title={`Trailer ${title}`}
                            className="pointer-events-none border-0"
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
                </div>

                {isLoading && open && !ready && (
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

                <div
                    ref={chromeRef}
                    className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black via-black/55 to-transparent pt-24"
                    style={{
                        opacity: open ? 1 : 0,
                        transition: `opacity ${FADE_MS}ms ${EASE_OPACITY}`,
                    }}
                >
                    <div className="pointer-events-auto flex items-end gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-base font-semibold text-white">{title}</p>
                            <p className="text-[11px] text-white/45">Trascina la barretta per chiudere</p>
                        </div>
                        <button
                            type="button"
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black/55 text-white ring-1 ring-white/20"
                            onClick={toggleAudio}
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
        </section>
    )
}
