'use client'

import { useEffect, useRef, useState } from 'react'
import {
    ArrowLeft,
    Maximize,
    Pause,
    Play,
    Volume2,
} from 'lucide-react'
import { useIsCoarsePointer } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'

type SkinId = 'cinema' | 'isola' | 'filo' | 'cornice'

const DURATION_S = 6512
const INTRO_MS = 1800
const SKIP_S = 10

const SKINS: Array<{
    id: SkinId
    name: string
    line: string
    recommended?: boolean
}> = [
    {
        id: 'cinema',
        name: 'Cinema',
        line: 'Sfumatura a tutta larghezza, play bianco come il sito.',
        recommended: true,
    },
    {
        id: 'isola',
        name: 'Isola',
        line: 'Pillola flottante, vetro come la navbar.',
    },
    {
        id: 'filo',
        name: 'Filo',
        line: 'Solo una linea. Il video resta il soggetto.',
    },
    {
        id: 'cornice',
        name: 'Cornice',
        line: 'Letterbox. Skip come testo, play come il bottone Guarda.',
    },
]

function formatTime(total: number) {
    const s = Math.max(0, Math.floor(total))
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    const mm = String(m).padStart(h > 0 ? 2 : 1, '0')
    const ss = String(sec).padStart(2, '0')
    return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`
}

function SkipTen({ dir }: { dir: 'back' | 'fwd' }) {
    const chevrons = (
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
    return (
        <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums">
            {dir === 'back' ? (
                <>
                    {chevrons}
                    <span>10</span>
                </>
            ) : (
                <>
                    <span>10</span>
                    {chevrons}
                </>
            )}
        </span>
    )
}

function Progress({
    current,
    duration,
    onSeek,
    height,
}: {
    current: number
    duration: number
    onSeek: (seconds: number) => void
    height: string
}) {
    const ratio = duration > 0 ? current / duration : 0
    return (
        <button
            type="button"
            aria-label="Avanzamento"
            className={cn('group relative w-full rounded-full bg-white/20', height)}
            onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect()
                const x = (event.clientX - rect.left) / rect.width
                onSeek(x * duration)
            }}
        >
            <span
                className="absolute inset-y-0 left-0 rounded-full bg-white"
                style={{ width: `${Math.min(100, ratio * 100)}%` }}
            />
        </button>
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

function BottomControls({
    skin,
    playing,
    current,
    onToggle,
    onSkip,
    onSeek,
}: {
    skin: SkinId
    playing: boolean
    current: number
    onToggle: () => void
    onSkip: (delta: number) => void
    onSeek: (seconds: number) => void
}) {
    const playMark = playing ? (
        <Pause className="h-5 w-5 fill-current" />
    ) : (
        <Play className="h-5 w-5 fill-current" />
    )

    if (skin === 'isola') {
        return (
            <div className="rounded-2xl border border-white/10 bg-black/70 px-4 pb-2.5 pt-3 backdrop-blur-xl">
                <Progress current={current} duration={DURATION_S} onSeek={onSeek} height="h-[3px]" />
                <div className="mt-2 flex items-center">
                    <span className="w-14 text-[11px] tabular-nums text-white/55">
                        {formatTime(current)}
                    </span>
                    <div className="flex flex-1 items-center justify-center gap-1">
                        <IconHit label="Indietro 10 secondi" onClick={() => onSkip(-SKIP_S)}>
                            <SkipTen dir="back" />
                        </IconHit>
                        <IconHit
                            label={playing ? 'Pausa' : 'Play'}
                            onClick={onToggle}
                            className="h-12 w-12 rounded-full bg-white text-black"
                        >
                            {playMark}
                        </IconHit>
                        <IconHit label="Avanti 10 secondi" onClick={() => onSkip(SKIP_S)}>
                            <SkipTen dir="fwd" />
                        </IconHit>
                    </div>
                    <span className="w-14 text-right text-[11px] tabular-nums text-white/55">
                        {formatTime(DURATION_S)}
                    </span>
                </div>
            </div>
        )
    }

    if (skin === 'filo') {
        return (
            <>
                <Progress current={current} duration={DURATION_S} onSeek={onSeek} height="h-px" />
                <div className="relative mt-2 flex items-center justify-center">
                    <span className="absolute left-0 text-[11px] tabular-nums text-white/50">
                        {formatTime(current)}
                    </span>
                    <div className="flex items-center gap-2">
                        <IconHit label="Indietro 10 secondi" onClick={() => onSkip(-SKIP_S)}>
                            <SkipTen dir="back" />
                        </IconHit>
                        <IconHit label={playing ? 'Pausa' : 'Play'} onClick={onToggle}>
                            {playMark}
                        </IconHit>
                        <IconHit label="Avanti 10 secondi" onClick={() => onSkip(SKIP_S)}>
                            <SkipTen dir="fwd" />
                        </IconHit>
                    </div>
                    <span className="absolute right-0 text-[11px] tabular-nums text-white/50">
                        {formatTime(DURATION_S)}
                    </span>
                </div>
            </>
        )
    }

    if (skin === 'cornice') {
        return (
            <div className="bg-black/80 px-10 pb-5 pt-4 backdrop-blur-sm">
                <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.22em] text-white/45">
                    S2 E4 · The Watcher
                </p>
                <Progress current={current} duration={DURATION_S} onSeek={onSeek} height="h-[4px]" />
                <div className="mt-3 flex items-center justify-between">
                    <button
                        type="button"
                        aria-label="Indietro 10 secondi"
                        onClick={() => onSkip(-SKIP_S)}
                        className="player-skin-hit px-2 text-[13px] font-medium tracking-wide text-white/80"
                    >
                        −10
                    </button>
                    <button
                        type="button"
                        aria-label={playing ? 'Pausa' : 'Play'}
                        onClick={onToggle}
                        className="player-skin-hit inline-flex h-11 items-center gap-2 rounded-md bg-white px-5 text-sm font-semibold text-black"
                    >
                        {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
                        {playing ? 'Pausa' : 'Guarda'}
                    </button>
                    <button
                        type="button"
                        aria-label="Avanti 10 secondi"
                        onClick={() => onSkip(SKIP_S)}
                        className="player-skin-hit px-2 text-[13px] font-medium tracking-wide text-white/80"
                    >
                        +10
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div
            className="px-8 pb-5 pt-16"
            style={{
                background:
                    'linear-gradient(to top, rgb(0 0 0 / 0.88) 0%, rgb(0 0 0 / 0.42) 48%, transparent 100%)',
            }}
        >
            <Progress current={current} duration={DURATION_S} onSeek={onSeek} height="h-[3px]" />
            <div className="mt-2.5 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <span className="text-[12px] tabular-nums text-white/70">
                    {formatTime(current)} / {formatTime(DURATION_S)}
                </span>
                <div className="flex items-center justify-center gap-0.5">
                    <IconHit
                        label="Indietro 10 secondi"
                        onClick={() => onSkip(-SKIP_S)}
                        className="min-w-[3.5rem]"
                    >
                        <SkipTen dir="back" />
                    </IconHit>
                    <IconHit
                        label={playing ? 'Pausa' : 'Play'}
                        onClick={onToggle}
                        className="h-12 w-12 rounded-full bg-white text-black"
                    >
                        {playMark}
                    </IconHit>
                    <IconHit
                        label="Avanti 10 secondi"
                        onClick={() => onSkip(SKIP_S)}
                        className="min-w-[3.5rem]"
                    >
                        <SkipTen dir="fwd" />
                    </IconHit>
                </div>
                <div className="flex items-center justify-end">
                    <IconHit label="Volume">
                        <Volume2 className="h-5 w-5" strokeWidth={1.75} />
                    </IconHit>
                    <IconHit label="Schermo intero">
                        <Maximize className="h-5 w-5" strokeWidth={1.75} />
                    </IconHit>
                </div>
            </div>
        </div>
    )
}

export function PlayerSkinGallery() {
    const isTouch = useIsCoarsePointer()
    const [skin, setSkin] = useState<SkinId>('cinema')
    const [intro, setIntro] = useState(true)
    const [hoverTop, setHoverTop] = useState(false)
    const [hoverBottom, setHoverBottom] = useState(false)
    const [playing, setPlaying] = useState(true)
    const [current, setCurrent] = useState(2538)
    const playingRef = useRef(playing)
    playingRef.current = playing

    useEffect(() => {
        setIntro(true)
        setHoverTop(false)
        setHoverBottom(false)
        if (isTouch) return
        const timer = window.setTimeout(() => setIntro(false), INTRO_MS)
        return () => window.clearTimeout(timer)
    }, [isTouch, skin])

    const open = isTouch || intro || hoverTop || hoverBottom

    useEffect(() => {
        let frame = 0
        let last = performance.now()
        const tick = (now: number) => {
            const delta = (now - last) / 1000
            last = now
            if (playingRef.current) {
                setCurrent((value) => Math.min(DURATION_S, value + delta))
            }
            frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frame)
    }, [])

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key === '1') setSkin('cinema')
            if (event.key === '2') setSkin('isola')
            if (event.key === '3') setSkin('filo')
            if (event.key === '4') setSkin('cornice')
            if (event.key === ' ') {
                event.preventDefault()
                setPlaying((value) => !value)
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])

    const onSkip = (delta: number) => {
        setCurrent((value) => Math.min(DURATION_S, Math.max(0, value + delta)))
    }

    const bottomClass =
        skin === 'isola'
            ? 'absolute bottom-6 inset-x-0 flex justify-center px-4'
            : skin === 'filo'
              ? 'absolute inset-x-0 bottom-0 px-6 pb-5'
              : 'absolute inset-x-0 bottom-0'

    return (
        <div className="relative min-h-dvh bg-black text-white">
            <div
                className="absolute inset-0 bg-[#090909]"
                onClick={() => setPlaying((value) => !value)}
            >
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            'radial-gradient(ellipse 70% 55% at 32% 38%, rgba(176,108,48,0.38), transparent 58%), radial-gradient(ellipse 45% 40% at 72% 68%, rgba(36,58,88,0.42), transparent 52%)',
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
            </div>

            <div
                className="player-chrome-hit absolute inset-x-0 top-0 z-20 h-20"
                onMouseEnter={() => setHoverTop(true)}
                onMouseLeave={() => setHoverTop(false)}
            >
                <div
                    className="player-skin-chrome player-skin-chrome-top px-4 pb-10 pt-4"
                    data-open={open}
                    style={{
                        background:
                            skin === 'filo'
                                ? 'none'
                                : 'linear-gradient(to bottom, rgb(0 0 0 / 0.72), transparent)',
                    }}
                >
                    <div className="flex items-center gap-3">
                        <a
                            href="/home"
                            className="player-skin-hit inline-flex h-11 items-center gap-2 rounded-md px-3 text-sm font-medium text-white"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Indietro
                        </a>
                        <p className="min-w-0 truncate text-sm text-white/70">S2 E4 · The Watcher</p>
                    </div>
                </div>
            </div>

            <div
                className="player-chrome-hit absolute inset-x-0 bottom-0 z-20 h-36"
                onMouseEnter={() => setHoverBottom(true)}
                onMouseLeave={() => setHoverBottom(false)}
            >
                <div
                    className={cn('player-skin-chrome player-skin-chrome-bottom', bottomClass)}
                    data-open={open}
                    onClick={(event) => event.stopPropagation()}
                >
                    <div className={skin === 'isola' ? 'w-[min(36rem,100%)]' : 'w-full'}>
                        <BottomControls
                            skin={skin}
                            playing={playing}
                            current={current}
                            onToggle={() => setPlaying((value) => !value)}
                            onSkip={onSkip}
                            onSeek={(seconds) => {
                                setCurrent(Math.min(DURATION_S, Math.max(0, seconds)))
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="pointer-events-none absolute inset-x-0 top-16 z-40 flex justify-center px-3 sm:top-3">
                <div
                    className="pointer-events-auto w-full max-w-xl rounded-xl border border-white/10 bg-black/80 p-1.5 backdrop-blur-xl"
                    onClick={(event) => event.stopPropagation()}
                >
                    <div className="grid grid-cols-4 gap-1">
                        {SKINS.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setSkin(item.id)}
                                className={cn(
                                    'rounded-lg px-2 py-2 text-center text-sm font-semibold transition-colors duration-150',
                                    skin === item.id
                                        ? 'bg-white text-black'
                                        : 'text-white/80 hover:bg-white/10'
                                )}
                            >
                                {item.name}
                            </button>
                        ))}
                    </div>
                    <p className="px-2 pb-1.5 pt-2 text-center text-[11px] leading-snug text-white/50">
                        {SKINS.find((item) => item.id === skin)?.line} Passa sul bordo alto o basso:
                        i tasti spariscono appena esci, come in hero.
                    </p>
                </div>
            </div>
        </div>
    )
}
