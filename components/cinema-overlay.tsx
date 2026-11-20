'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { ArrowLeft, Check, Maximize, Minimize2, Pause, Play, SkipForward, Subtitles, Volume2, VolumeX } from 'lucide-react'
import { useIsCoarsePointer } from '@/hooks/useMediaQuery'
import {
    isPlayerFullscreen,
    subscribePlayerFullscreen,
    togglePlayerFullscreen,
} from '@/lib/player-fullscreen'
import { cn } from '@/lib/utils'
import { SUPPORTED_LANGUAGES, findMatchingSubtitleIndex } from '@/contexts/LanguageContext'

const INTRO_MS = 1800
const CURSOR_HIDE_MS = 2000
const TOUCH_HIDE_MS = 2000
const SKIP_S = 10

export function shouldHidePlayerCursor(opts: {
    isTouch: boolean
    playing: boolean
    chromeOpen: boolean
    idle: boolean
}) {
    return !opts.isTouch && opts.playing && !opts.chromeOpen && opts.idle
}

export function shouldShowPlayerChrome(opts: {
    chromePaused: boolean
    intro: boolean
    hoverTop: boolean
    hoverBottom: boolean
    tapped: boolean
}) {
    if (opts.chromePaused) return false
    return opts.intro || opts.hoverTop || opts.hoverBottom || opts.tapped
}

export function shouldShowNextButton(opts: {
    chromePaused: boolean
    pinNext: boolean
    chromeOpen: boolean
    hasNext: boolean
}) {
    if (!opts.hasNext || opts.chromePaused) return false
    return opts.chromeOpen || opts.pinNext
}

export function formatCueTime(sec: number) {
    const absSec = Math.abs(sec)
    const sign = sec >= 0 ? '+' : '-'
    if (absSec < 60) {
        return `${sign}${absSec}s`
    }
    const m = Math.floor(absSec / 60)
    const s = absSec % 60
    if (s === 0) return `${sign}${m}m`
    return `${sign}${m}m ${s}s`
}

export function formatMediaTime(total: number) {
    if (!Number.isFinite(total) || total < 0) return '0:00'
    const s = Math.floor(total)
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    const mm = String(m).padStart(h > 0 ? 2 : 1, '0')
    const ss = String(sec).padStart(2, '0')
    return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`
}

function SkipTen({ dir }: { dir: 'back' | 'fwd' }) {
    return (
        <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums">
            {dir === 'back' ? (
                <>
                    <SkipChevrons dir="back" />
                    <span>10</span>
                </>
            ) : (
                <>
                    <span>10</span>
                    <SkipChevrons dir="fwd" />
                </>
            )}
        </span>
    )
}

function SkipChevrons({ dir }: { dir: 'back' | 'fwd' }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            {dir === 'back' ? (
                <>
                    <path d="M11 6 4 12l7 6" />
                    <path d="M19 6l-7 6 7 6" />
                </>
            ) : (
                <>
                    <path d="M13 6l7 6-7 6" />
                    <path d="M5 6l7 6-7 6" />
                </>
            )}
        </svg>
    )
}

function IconHit({
    label,
    onClick,
    children,
    className,
}: {
    label: string
    onClick?: () => void
    children: React.ReactNode
    className?: string
}) {
    return (
        <button
            type="button"
            aria-label={label}
            onClick={onClick}
            className={cn(
                'player-skin-hit inline-flex h-11 min-w-11 items-center justify-center text-white',
                className
            )}
        >
            {children}
        </button>
    )
}

export interface SubtitleTrackOption {
    id: number
    name: string
    lang?: string
}

interface CinemaOverlayProps {
    videoRef: React.RefObject<HTMLVideoElement | null>
    stageRef: React.RefObject<HTMLElement | null>
    title?: string
    onBack?: () => void
    onNext?: () => void
    nextLabel?: string
    pinNext?: boolean
    chromePaused?: boolean
    resetKey: string
    subtitleTracks?: SubtitleTrackOption[]
    activeSubtitleTrack?: number
    onSelectSubtitleTrack?: (trackId: number) => void
}

export function CinemaOverlay({
    videoRef,
    stageRef,
    title,
    onBack,
    onNext,
    nextLabel,
    pinNext = false,
    chromePaused = false,
    resetKey,
    subtitleTracks = [],
    activeSubtitleTrack = -1,
    onSelectSubtitleTrack,
}: CinemaOverlayProps) {
    const isTouch = useIsCoarsePointer()
    const [intro, setIntro] = useState(true)
    const [hoverTop, setHoverTop] = useState(false)
    const [hoverBottom, setHoverBottom] = useState(false)
    const [playing, setPlaying] = useState(false)
    const [idle, setIdle] = useState(false)
    const [tapped, setTapped] = useState(false)
    const [muted, setMuted] = useState(false)
    const [fullscreen, setFullscreen] = useState(false)
    const [seekCue, setSeekCue] = useState<{ text: string; dir: 'back' | 'fwd' } | null>(null)
    const [subtitleMenuOpen, setSubtitleMenuOpen] = useState(false)
    const [hoveredSub, setHoveredSub] = useState<string | number | null>(null)
    const subMenuRef = useRef<HTMLDivElement | null>(null)
    const fillRef = useRef<HTMLSpanElement>(null)
    const timeRef = useRef<HTMLSpanElement>(null)
    const durationRef = useRef<HTMLSpanElement>(null)
    const trackRef = useRef<HTMLButtonElement>(null)
    const dragging = useRef(false)
    const hideTimerRef = useRef(0)
    const cueTimerRef = useRef(0)
    const pendingSeekTimeRef = useRef<number | null>(null)
    const seekDebounceTimerRef = useRef<number>(0)

    useEffect(() => {
        if (!subtitleMenuOpen) return
        const onPointerDown = (e: MouseEvent | TouchEvent) => {
            if (subMenuRef.current && !subMenuRef.current.contains(e.target as Node)) {
                setSubtitleMenuOpen(false)
            }
        }
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSubtitleMenuOpen(false)
        }
        document.addEventListener('pointerdown', onPointerDown)
        document.addEventListener('keydown', onKeyDown)
        return () => {
            document.removeEventListener('pointerdown', onPointerDown)
            document.removeEventListener('keydown', onKeyDown)
        }
    }, [subtitleMenuOpen])

    const hideChrome = useCallback(() => {
        window.clearTimeout(hideTimerRef.current)
        setTapped(false)
    }, [])

    const revealChrome = useCallback(() => {
        setTapped(true)
        window.clearTimeout(hideTimerRef.current)
        hideTimerRef.current = window.setTimeout(() => {
            if (dragging.current) return
            const video = videoRef.current
            if (video?.paused) return
            setTapped(false)
        }, TOUCH_HIDE_MS)
    }, [videoRef])

    useEffect(() => {
        setHoverTop(false)
        setHoverBottom(false)
        hideChrome()
        if (isTouch) {
            setIntro(false)
            return
        }
        setIntro(true)
        const timer = window.setTimeout(() => setIntro(false), INTRO_MS)
        return () => window.clearTimeout(timer)
    }, [hideChrome, isTouch, resetKey])

    const open = shouldShowPlayerChrome({
        chromePaused,
        intro,
        hoverTop,
        hoverBottom,
        tapped,
    }) || subtitleMenuOpen
    const nextShown = shouldShowNextButton({
        chromePaused,
        pinNext,
        chromeOpen: open,
        hasNext: Boolean(onNext),
    })
    const hideCursor = shouldHidePlayerCursor({
        isTouch,
        playing,
        chromeOpen: open,
        idle,
    })

    useEffect(() => {
        if (isTouch || chromePaused) {
            setIdle(false)
            return
        }
        const stage = stageRef.current
        if (!stage) return

        let timer = 0
        const bump = () => {
            setIdle(false)
            window.clearTimeout(timer)
            timer = window.setTimeout(() => setIdle(true), CURSOR_HIDE_MS)
        }
        bump()
        stage.addEventListener('mousemove', bump)
        stage.addEventListener('pointerdown', bump)
        return () => {
            window.clearTimeout(timer)
            stage.removeEventListener('mousemove', bump)
            stage.removeEventListener('pointerdown', bump)
        }
    }, [chromePaused, isTouch, resetKey, stageRef])

    useEffect(() => {
        const stage = stageRef.current
        if (!stage) return
        stage.classList.toggle('player-idle-cursor', hideCursor)
        return () => stage.classList.remove('player-idle-cursor')
    }, [hideCursor, stageRef])

    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        const sync = () => {
            setPlaying(!video.paused)
            setMuted(video.muted || video.volume === 0)
        }
        sync()
        video.addEventListener('play', sync)
        video.addEventListener('pause', sync)
        video.addEventListener('volumechange', sync)
        return () => {
            video.removeEventListener('play', sync)
            video.removeEventListener('pause', sync)
            video.removeEventListener('volumechange', sync)
        }
    }, [videoRef, resetKey])

    useEffect(() => {
        return () => {
            window.clearTimeout(hideTimerRef.current)
            window.clearTimeout(cueTimerRef.current)
            window.clearTimeout(seekDebounceTimerRef.current)
        }
    }, [])

    useEffect(() => {
        if (chromePaused) hideChrome()
    }, [chromePaused, hideChrome])

    useEffect(() => {
        const video = videoRef.current
        const sync = () => setFullscreen(isPlayerFullscreen(video))
        sync()
        return subscribePlayerFullscreen(video, sync)
    }, [resetKey, videoRef])

    useEffect(() => {
        let frame = 0
        const tick = () => {
            const video = videoRef.current
            if (video) {
                const duration = Number.isFinite(video.duration) ? video.duration : 0
                const ratio = duration > 0 ? video.currentTime / duration : 0
                if (fillRef.current) fillRef.current.style.width = `${Math.min(100, ratio * 100)}%`
                if (timeRef.current) timeRef.current.textContent = formatMediaTime(video.currentTime)
                if (durationRef.current) durationRef.current.textContent = formatMediaTime(duration)
            }
            frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frame)
    }, [videoRef])

    const showCueMessage = useCallback((text: string, dir: 'back' | 'fwd') => {
        setSeekCue({ text, dir })
        window.clearTimeout(cueTimerRef.current)
        cueTimerRef.current = window.setTimeout(() => {
            setSeekCue(null)
        }, 1100)
    }, [])

    const seekFromClientX = useCallback(
        (clientX: number) => {
            const video = videoRef.current
            const track = trackRef.current
            if (!video || !track || !Number.isFinite(video.duration)) return
            const rect = track.getBoundingClientRect()
            const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
            const prev = video.currentTime
            const target = ratio * video.duration
            video.currentTime = target
            const delta = Math.round(target - prev)
            if (Math.abs(delta) >= 2) {
                showCueMessage(formatCueTime(delta), delta >= 0 ? 'fwd' : 'back')
            }
        },
        [showCueMessage, videoRef]
    )

    const skip = useCallback((delta: number) => {
        const video = videoRef.current
        if (!video || !Number.isFinite(video.duration)) return
        const d = video.duration
        const base = pendingSeekTimeRef.current !== null ? pendingSeekTimeRef.current : (video.currentTime || 0)
        let next = base + delta
        if (next < 0) next = 0
        if (d && isFinite(d) && next > d - 0.5) next = Math.max(0, d - 0.5)
        pendingSeekTimeRef.current = next

        const diffFromCurrent = Math.round(next - (video.currentTime || 0))
        showCueMessage(formatCueTime(diffFromCurrent), diffFromCurrent >= 0 ? 'fwd' : 'back')

        window.clearTimeout(seekDebounceTimerRef.current)
        seekDebounceTimerRef.current = window.setTimeout(() => {
            const target = pendingSeekTimeRef.current
            pendingSeekTimeRef.current = null
            if (target !== null && videoRef.current) {
                try {
                    videoRef.current.currentTime = target
                } catch {}
            }
        }, 220)
    }, [showCueMessage, videoRef])

    const togglePlay = () => {
        const video = videoRef.current
        if (!video) return
        if (video.paused) void video.play()
        else video.pause()
    }

    const toggleMute = () => {
        const video = videoRef.current
        if (!video) return
        video.muted = !video.muted
    }

    const toggleFullscreen = () => {
        void togglePlayerFullscreen(stageRef.current, videoRef.current)
    }

    useEffect(() => {
        if (chromePaused) return
        const onKey = (event: KeyboardEvent) => {
            const video = videoRef.current
            if (!video) return
            const target = event.target
            if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return
            if (event.code === 'Space' || event.key === 'k' || event.key === 'K') {
                event.preventDefault()
                if (video.paused) void video.play()
                else video.pause()
            }
            if (event.key === 'ArrowLeft') {
                event.preventDefault()
                skip(-SKIP_S)
            }
            if (event.key === 'ArrowRight') {
                event.preventDefault()
                skip(SKIP_S)
            }
            if (event.key === 'm' || event.key === 'M') {
                video.muted = !video.muted
            }
            if (event.key === 'f' || event.key === 'F') {
                void togglePlayerFullscreen(stageRef.current, video)
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [chromePaused, stageRef, videoRef])

    return (
        <>
            {seekCue && (
                <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center animate-in fade-in zoom-in-90 duration-150">
                    <div className="flex flex-col items-center justify-center rounded-2xl bg-black/75 px-7 py-5 backdrop-blur-md shadow-2xl border border-white/10 text-white">
                        <div className="flex items-center gap-2 mb-1">
                            <SkipChevrons dir={seekCue.dir} />
                            <span className="text-3xl sm:text-4xl font-bold tracking-tight tabular-nums">
                                {seekCue.text}
                            </span>
                            <SkipChevrons dir={seekCue.dir} />
                        </div>
                        <span className="text-xs uppercase tracking-wider text-white/70 font-medium">
                            {seekCue.dir === 'fwd' ? 'Avanti' : 'Indietro'}
                        </span>
                    </div>
                </div>
            )}

            {!playing && !open && !chromePaused && (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                    <Play className="h-14 w-14 fill-white/80 text-white/80" />
                </div>
            )}

            {isTouch && !chromePaused && (
                <button
                    type="button"
                    className="absolute inset-0 z-[15] bg-transparent"
                    aria-label={open ? 'Nascondi controlli' : 'Mostra controlli'}
                    onClick={() => {
                        if (open) hideChrome()
                        else revealChrome()
                    }}
                />
            )}

            <div
                className={cn(
                    'player-chrome-hit absolute inset-x-0 top-0 z-20 h-20',
                    isTouch && !open && 'pointer-events-none'
                )}
                onMouseEnter={() => setHoverTop(true)}
                onMouseLeave={() => setHoverTop(false)}
                onPointerDown={() => {
                    if (isTouch) revealChrome()
                }}
            >
                <div className="player-skin-chrome player-skin-chrome-top px-4 pb-10 pt-4" data-open={open}>
                    <div
                        className="flex items-center gap-2 sm:gap-3"
                        style={{
                            background: 'linear-gradient(to bottom, rgb(0 0 0 / 0.72), transparent)',
                            margin: '-1rem -1rem 0',
                            padding: '1rem 1rem 2.5rem',
                            paddingRight: onNext ? '13rem' : '1rem',
                        }}
                    >
                        {onBack && (
                            <button
                                type="button"
                                onClick={onBack}
                                className="player-skin-hit inline-flex h-11 items-center gap-2 rounded-md px-3 text-sm font-medium text-white"
                                aria-label="Indietro"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Indietro
                            </button>
                        )}
                        {title && (
                            <p className="min-w-0 flex-1 truncate text-sm text-white/70">{title}</p>
                        )}
                    </div>
                </div>
                {onNext && (
                    <div
                        className="player-skin-chrome player-skin-chrome-top absolute right-4 top-4 z-30"
                        data-open={nextShown}
                    >
                        <button
                            type="button"
                            onClick={onNext}
                            className={cn(
                                'player-skin-hit inline-flex h-11 items-center gap-2 rounded-md px-3 text-sm font-medium text-white',
                                nextShown && !open && 'bg-black/60'
                            )}
                            aria-label={nextLabel ? `Prossima ${nextLabel}` : 'Puntata successiva'}
                        >
                            Prossima
                            {nextLabel ? ` ${nextLabel}` : ''}
                            <SkipForward className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>

            <div
                className={cn(
                    'player-chrome-hit absolute inset-x-0 bottom-0 z-20 h-36',
                    isTouch && !open && 'pointer-events-none'
                )}
                onMouseEnter={() => setHoverBottom(true)}
                onMouseLeave={() => setHoverBottom(false)}
                onPointerDown={() => {
                    if (isTouch) revealChrome()
                }}
            >
                <div className="player-skin-chrome player-skin-chrome-bottom absolute inset-x-0 bottom-0" data-open={open}>
                    <div
                        className="px-8 pb-5 pt-16"
                        style={{
                            background:
                                'linear-gradient(to top, rgb(0 0 0 / 0.88) 0%, rgb(0 0 0 / 0.42) 48%, transparent 100%)',
                        }}
                    >
                        <button
                            ref={trackRef}
                            type="button"
                            aria-label="Avanzamento"
                            className="relative h-[3px] w-full rounded-full bg-white/20"
                            onPointerDown={(event) => {
                                dragging.current = true
                                event.currentTarget.setPointerCapture(event.pointerId)
                                seekFromClientX(event.clientX)
                            }}
                            onPointerMove={(event) => {
                                if (!dragging.current) return
                                seekFromClientX(event.clientX)
                            }}
                            onPointerUp={() => {
                                dragging.current = false
                                if (isTouch) revealChrome()
                            }}
                        >
                            <span
                                ref={fillRef}
                                className="absolute inset-y-0 left-0 rounded-full bg-white"
                                style={{ width: '0%' }}
                            />
                        </button>
                        <div className="mt-2.5 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                            <span className="text-[12px] tabular-nums text-white/70">
                                <span ref={timeRef}>0:00</span>
                                {' / '}
                                <span ref={durationRef}>0:00</span>
                            </span>
                            <div className="flex items-center justify-center gap-0.5">
                                <IconHit
                                    label="Indietro 10 secondi"
                                    onClick={() => skip(-SKIP_S)}
                                    className="min-w-[3.5rem]"
                                >
                                    <SkipTen dir="back" />
                                </IconHit>
                                <IconHit
                                    label={playing ? 'Pausa' : 'Play'}
                                    onClick={togglePlay}
                                    className="h-12 w-12 rounded-full bg-white text-black"
                                >
                                    {playing ? (
                                        <Pause className="h-5 w-5 fill-current" />
                                    ) : (
                                        <Play className="h-5 w-5 fill-current" />
                                    )}
                                </IconHit>
                                <IconHit
                                    label="Avanti 10 secondi"
                                    onClick={() => skip(SKIP_S)}
                                    className="min-w-[3.5rem]"
                                >
                                    <SkipTen dir="fwd" />
                                </IconHit>
                            </div>
                            <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                                <div ref={subMenuRef} className="relative">
                                    <IconHit
                                        label={activeSubtitleTrack !== -1 ? 'Sottotitoli attivi' : 'Sottotitoli'}
                                        onClick={() => {
                                            setSubtitleMenuOpen((prev) => !prev)
                                            if (isTouch) revealChrome()
                                        }}
                                        className={cn(
                                            'relative',
                                            (subtitleMenuOpen || activeSubtitleTrack !== -1) && 'text-white'
                                        )}
                                    >
                                        <Subtitles className="h-5 w-5" strokeWidth={1.75} />
                                        {activeSubtitleTrack !== -1 && (
                                            <span className="absolute bottom-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.9)]" />
                                        )}
                                    </IconHit>

                                    <AnimatePresence>
                                        {subtitleMenuOpen && (
                                            <motion.div
                                                key="subtitle-popover"
                                                initial={{ opacity: 0, scale: 0.94, y: 8 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.94, y: 8 }}
                                                transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                                                style={{ transformOrigin: 'bottom right' }}
                                                className="absolute bottom-full right-0 mb-3 z-50 w-72 max-h-80 overflow-y-auto rounded-2xl border border-white/10 bg-zinc-950/95 p-1.5 backdrop-blur-2xl shadow-2xl shadow-black/90 text-white scrollbar-none"
                                            >
                                                <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <Subtitles className="h-4 w-4 text-white/50" />
                                                        <span className="text-[12px] font-semibold uppercase tracking-wider text-white/70">
                                                            Sottotitoli
                                                        </span>
                                                    </div>
                                                    <span className="text-[11px] font-medium text-white/40 truncate max-w-[120px]">
                                                        {activeSubtitleTrack === -1
                                                            ? 'Disattivati'
                                                            : (subtitleTracks.find((t) => t.id === activeSubtitleTrack)?.name || 'Attivi')}
                                                    </span>
                                                </div>

                                                <LayoutGroup id="sub-hover-group">
                                                    <div className="flex flex-col gap-0.5">
                                                        <motion.button
                                                            type="button"
                                                            onClick={() => {
                                                                onSelectSubtitleTrack?.(-1)
                                                                setSubtitleMenuOpen(false)
                                                            }}
                                                            onMouseEnter={() => setHoveredSub('off')}
                                                            onMouseLeave={() => setHoveredSub(null)}
                                                            whileTap={{ scale: 0.97 }}
                                                            className={cn(
                                                                'relative flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[13px] font-medium outline-none transition-colors duration-150',
                                                                activeSubtitleTrack === -1 ? 'text-white' : 'text-white/60 hover:text-white'
                                                            )}
                                                        >
                                                            {hoveredSub === 'off' && (
                                                                <motion.span
                                                                    layoutId="sub-hover-highlight"
                                                                    className="absolute inset-0 rounded-lg bg-white/[0.08]"
                                                                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                                                />
                                                            )}
                                                            <span className="relative z-10">Disattivati</span>
                                                            {activeSubtitleTrack === -1 && (
                                                                <motion.span
                                                                    initial={{ scale: 0 }}
                                                                    animate={{ scale: 1 }}
                                                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                                    className="relative z-10 text-white"
                                                                >
                                                                    <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                                                                </motion.span>
                                                            )}
                                                        </motion.button>

                                                        <div className="my-1 border-t border-white/5" />
                                                        <div className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                                                            Lingue principali
                                                        </div>

                                                        {SUPPORTED_LANGUAGES.map((opt) => {
                                                            const matchingIdx = findMatchingSubtitleIndex(subtitleTracks, opt.code)
                                                            const isAvailable = matchingIdx !== -1
                                                            const isSelected = isAvailable && activeSubtitleTrack === matchingIdx

                                                            return (
                                                                <motion.button
                                                                    key={opt.code}
                                                                    type="button"
                                                                    disabled={!isAvailable}
                                                                    onClick={() => {
                                                                        if (isAvailable) {
                                                                            onSelectSubtitleTrack?.(matchingIdx)
                                                                            setSubtitleMenuOpen(false)
                                                                        }
                                                                    }}
                                                                    onMouseEnter={() => isAvailable && setHoveredSub(opt.code)}
                                                                    onMouseLeave={() => setHoveredSub(null)}
                                                                    whileTap={isAvailable ? { scale: 0.97 } : undefined}
                                                                    className={cn(
                                                                        'relative flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[13px] font-medium outline-none transition-colors duration-150',
                                                                        isSelected
                                                                            ? 'text-white'
                                                                            : isAvailable
                                                                            ? 'text-white/60 hover:text-white'
                                                                            : 'text-white/30 cursor-not-allowed'
                                                                    )}
                                                                >
                                                                    {isAvailable && hoveredSub === opt.code && (
                                                                        <motion.span
                                                                            layoutId="sub-hover-highlight"
                                                                            className="absolute inset-0 rounded-lg bg-white/[0.08]"
                                                                            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                                                        />
                                                                    )}
                                                                    <span className="relative z-10 truncate">{opt.fullName}</span>

                                                                    {isSelected && (
                                                                        <motion.span
                                                                            initial={{ scale: 0 }}
                                                                            animate={{ scale: 1 }}
                                                                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                                            className="relative z-10 text-white"
                                                                        >
                                                                            <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                                                                        </motion.span>
                                                                    )}
                                                                </motion.button>
                                                            )
                                                        })}

                                                        {/* Additional stream tracks if any */}
                                                        {subtitleTracks
                                                            .filter((t) => {
                                                                return !SUPPORTED_LANGUAGES.some((opt) =>
                                                                    findMatchingSubtitleIndex([t], opt.code) !== -1
                                                                )
                                                            })
                                                            .map((t) => {
                                                                const isSelected = activeSubtitleTrack === t.id
                                                                return (
                                                                    <motion.button
                                                                        key={`extra-${t.id}`}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            onSelectSubtitleTrack?.(t.id)
                                                                            setSubtitleMenuOpen(false)
                                                                        }}
                                                                        onMouseEnter={() => setHoveredSub(`extra-${t.id}`)}
                                                                        onMouseLeave={() => setHoveredSub(null)}
                                                                        whileTap={{ scale: 0.97 }}
                                                                        className={cn(
                                                                            'relative flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[13px] font-medium outline-none transition-colors duration-150',
                                                                            isSelected ? 'text-white' : 'text-white/60 hover:text-white'
                                                                        )}
                                                                    >
                                                                        {hoveredSub === `extra-${t.id}` && (
                                                                            <motion.span
                                                                                layoutId="sub-hover-highlight"
                                                                                className="absolute inset-0 rounded-lg bg-white/[0.08]"
                                                                                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                                                            />
                                                                        )}
                                                                        <span className="relative z-10 truncate">{t.name}</span>
                                                                        {isSelected && (
                                                                            <motion.span
                                                                                initial={{ scale: 0 }}
                                                                                animate={{ scale: 1 }}
                                                                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                                                className="relative z-10 text-white"
                                                                            >
                                                                                <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                                                                            </motion.span>
                                                                        )}
                                                                    </motion.button>
                                                                )
                                                            })}
                                                    </div>
                                                </LayoutGroup>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <IconHit label={muted ? 'Audio' : 'Muto'} onClick={toggleMute}>
                                    {muted ? (
                                        <VolumeX className="h-5 w-5" strokeWidth={1.75} />
                                    ) : (
                                        <Volume2 className="h-5 w-5" strokeWidth={1.75} />
                                    )}
                                </IconHit>
                                <IconHit
                                    label={fullscreen ? 'Esci da schermo intero' : 'Schermo intero'}
                                    onClick={toggleFullscreen}
                                >
                                    {fullscreen ? (
                                        <Minimize2 className="h-5 w-5" strokeWidth={1.75} />
                                    ) : (
                                        <Maximize className="h-5 w-5" strokeWidth={1.75} />
                                    )}
                                </IconHit>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
