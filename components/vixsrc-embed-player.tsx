'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'
import { Button } from '@/components/ui/button'
import { Play } from 'lucide-react'
import { toast } from 'sonner'
import { Spinner } from '@/components/ui/spinner'
import { CinemaOverlay } from '@/components/cinema-overlay'
import { usePlayerChrome } from '@/components/player-chrome-context'
import { ContentType } from '@/lib/content-navigation'
import { pickHighestHlsLevel } from '@/lib/hls-quality'
import { HLS_CONFIG } from '@/utils/hls-config'
import { createVixsrcBrowserSource } from '@/lib/vixsrc-hls'
import { fetchResolvedPlayback } from '@/lib/player-resolve'
import { VixsrcPlayerEvent } from '@/lib/vixsrc-player-events'

const LOAD_TIMEOUT_MS = 55000

interface VixsrcEmbedPlayerProps {
    tmdbId: number
    type: ContentType
    season?: number
    episode?: number
    title: string
    startAt?: number
    onPlayback?: (playback: VixsrcPlayerEvent) => void
    onEnded?: () => void
    onBack?: () => void
    unavailableTitle?: string
    unavailableDescription?: string
    nativeControls?: boolean
}

export function VixsrcEmbedPlayer({
    tmdbId,
    type,
    season,
    episode,
    title,
    startAt,
    onPlayback,
    onEnded,
    onBack,
    unavailableTitle = 'Contenuto non disponibile',
    unavailableDescription = 'Questo titolo non è attualmente disponibile su vixsrc.to',
    nativeControls = false,
}: VixsrcEmbedPlayerProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const stageRef = useRef<HTMLDivElement | null>(null)
    const shell = usePlayerChrome()
    const hlsRef = useRef<Hls | null>(null)
    const startAtRef = useRef(startAt)
    const onPlaybackRef = useRef(onPlayback)
    const onEndedRef = useRef(onEnded)
    startAtRef.current = startAt
    onPlaybackRef.current = onPlayback
    onEndedRef.current = onEnded
    const [error, setError] = useState(false)
    const [streamMissing, setStreamMissing] = useState(false)
    const [ready, setReady] = useState(false)
    const [reloadKey, setReloadKey] = useState(0)

    const emit = useCallback((event: VixsrcPlayerEvent['event'], video: HTMLVideoElement, videoId?: number) => {
        const playback: VixsrcPlayerEvent = {
            event,
            currentTime: video.currentTime,
            duration: Number.isFinite(video.duration) ? video.duration : 0,
            video_id: videoId,
        }
        onPlaybackRef.current?.(playback)
        if (event === 'ended') onEndedRef.current?.()
    }, [])

    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        let cancelled = false
        let revokeSource: (() => void) | undefined
        let timeout = 0
        const fail = (missing: boolean, message: string) => {
            if (cancelled) return
            window.clearTimeout(timeout)
            setStreamMissing(missing)
            setError(true)
            toast.error(message)
        }

        timeout = window.setTimeout(() => {
            fail(false, 'Il player non si è caricato in tempo')
        }, LOAD_TIMEOUT_MS)

        const query = new URLSearchParams({ tmdbId: String(tmdbId), type })
        if (type === 'tv' && season && episode) {
            query.set('season', String(season))
            query.set('episode', String(episode))
        }

        setError(false)
        setStreamMissing(false)
        setReady(false)

        const start = async () => {
            try {
                const payload = await fetchResolvedPlayback(query)
                if (!payload.data?.master) {
                    fail(payload.missing, payload.error || 'Stream non disponibile')
                    return
                }
                if (cancelled) return

                const source = createVixsrcBrowserSource({
                    master: payload.data.master,
                    parts: payload.data.parts ?? {},
                    origin: window.location.origin,
                })
                revokeSource = source.revoke
                const playlist = source.url
                const videoId = payload.data.videoId
                const onReady = () => {
                    if (cancelled) return
                    window.clearTimeout(timeout)
                    setReady(true)
                    const resumeAt = startAtRef.current
                    if (resumeAt && resumeAt > 0) {
                        video.currentTime = resumeAt
                    }
                    void video.play().catch(() => undefined)
                }

                video.onplay = () => emit('play', video, videoId)
                video.onpause = () => emit('pause', video, videoId)
                video.onseeked = () => emit('seeked', video, videoId)
                video.onended = () => emit('ended', video, videoId)
                video.ontimeupdate = () => emit('timeupdate', video, videoId)
                video.onloadedmetadata = onReady

                if (Hls.isSupported()) {
                    const hls = new Hls({
                        enableWorker: HLS_CONFIG.enableWorker,
                        maxBufferLength: HLS_CONFIG.maxBufferLength,
                        backBufferLength: HLS_CONFIG.backBufferLength,
                        testBandwidth: HLS_CONFIG.testBandwidth,
                        capLevelToPlayerSize: HLS_CONFIG.capLevelToPlayerSize,
                        abrEwmaDefaultEstimate: HLS_CONFIG.abrEwmaDefaultEstimate,
                    })
                    hlsRef.current = hls
                    hls.on(Hls.Events.MANIFEST_PARSED, () => {
                        const best = pickHighestHlsLevel(hls.levels)
                        hls.startLevel = best
                    })
                    hls.loadSource(playlist)
                    hls.attachMedia(video)
                    let recoveries = 0
                    hls.on(Hls.Events.ERROR, (_event, data) => {
                        if (!data.fatal || cancelled) return
                        if (recoveries < 2 && data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                            recoveries += 1
                            hls.startLoad()
                            return
                        }
                        if (recoveries < 2 && data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                            recoveries += 1
                            hls.recoverMediaError()
                            return
                        }
                        fail(false, 'Impossibile caricare il player')
                    })
                } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = playlist
                } else {
                    fail(false, 'HLS non supportato')
                }
            } catch (error) {
                fail(false, error instanceof Error ? error.message : 'Impossibile caricare il player')
            }
        }

        void start()

        return () => {
            cancelled = true
            window.clearTimeout(timeout)
            video.onplay = null
            video.onpause = null
            video.onseeked = null
            video.onended = null
            video.ontimeupdate = null
            video.onloadedmetadata = null
            hlsRef.current?.destroy()
            hlsRef.current = null
            revokeSource?.()
            video.removeAttribute('src')
            video.load()
        }
    }, [emit, episode, reloadKey, season, tmdbId, type])

    const overlayBack = shell?.onBack ?? onBack
    const overlayTitle = shell?.title ?? title

    return (
        <div ref={stageRef} className="relative z-10 h-full w-full bg-black">
            {error && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black">
                    <div className="text-center max-w-2xl mx-auto px-8">
                        <h1 className="text-4xl font-bold mb-4 text-white">{title}</h1>
                        <p className="text-xl text-gray-300 mb-2">
                            {streamMissing ? unavailableTitle : 'Impossibile caricare lo stream'}
                        </p>
                        <p className="text-lg text-gray-400 mb-8">
                            {streamMissing
                                ? unavailableDescription
                                : 'Lo stream risulta presente su VixSrc, ma il player non è riuscito a ottenerlo. Riprova.'}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button
                                size="lg"
                                onClick={() => {
                                    setError(false)
                                    setReloadKey((value) => value + 1)
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                <Play className="w-5 h-5 mr-2" />
                                Riprova
                            </Button>
                            {onBack && (
                                <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={onBack}
                                    className="border-white/30 text-white hover:bg-white/10"
                                >
                                    Torna indietro
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {!ready && !error && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
                    <Spinner size="md" />
                </div>
            )}
            <video
                ref={videoRef}
                className="h-full w-full bg-black object-contain"
                controls={nativeControls}
                playsInline
                autoPlay
                title={title}
                onClick={() => {
                    if (nativeControls) return
                    const video = videoRef.current
                    if (!video) return
                    if (video.paused) void video.play()
                    else video.pause()
                }}
            />
            {!nativeControls && !error && (
                <CinemaOverlay
                    videoRef={videoRef}
                    stageRef={stageRef}
                    title={overlayTitle}
                    onBack={overlayBack}
                    onNext={shell?.onNext}
                    nextLabel={shell?.nextLabel}
                    pinChrome={shell?.pinChrome}
                    chromePaused={shell?.chromePaused}
                    resetKey={`${tmdbId}-${season ?? 0}-${episode ?? 0}-${reloadKey}`}
                />
            )}
        </div>
    )
}
