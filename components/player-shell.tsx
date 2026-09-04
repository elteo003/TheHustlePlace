'use client'

import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, SkipForward } from 'lucide-react'
import { useReducedMotion } from '@/hooks/useMediaQuery'

const IDLE_MS = 2500

const chromeBtnClass =
    'inline-flex min-h-11 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40'

interface PlayerShellProps {
    backdropPath?: string | null
    onBack: () => void
    onNext?: () => void
    nextLabel?: string
    title?: string
    chromePaused?: boolean
    /** Tiene la chrome visibile (ultimi minuti della puntata). */
    pinChrome?: boolean
    children: ReactNode
    footer?: ReactNode
}

export function PlayerShell({
    backdropPath,
    onBack,
    onNext,
    nextLabel,
    title,
    chromePaused = false,
    pinChrome = false,
    children,
    footer,
}: PlayerShellProps) {
    const backdropUrl =
        backdropPath && backdropPath !== '/placeholder-movie.svg'
            ? `https://image.tmdb.org/t/p/original${backdropPath}`
            : undefined

    const [chromeVisible, setChromeVisible] = useState(true)
    const idleRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const reduceMotion = useReducedMotion()

    const revealChrome = useCallback(() => {
        if (chromePaused) return
        setChromeVisible(true)
        if (idleRef.current) clearTimeout(idleRef.current)
        if (pinChrome) return
        idleRef.current = setTimeout(() => setChromeVisible(false), IDLE_MS)
    }, [chromePaused, pinChrome])

    useEffect(() => {
        if (chromePaused) {
            setChromeVisible(false)
            if (idleRef.current) clearTimeout(idleRef.current)
            return
        }
        revealChrome()
        return () => {
            if (idleRef.current) clearTimeout(idleRef.current)
        }
    }, [chromePaused, revealChrome])

    const chromeInteractive = chromeVisible && !chromePaused
    const fadeClass = reduceMotion ? '' : 'transition-opacity duration-300 ease-out'
    const interactive = chromeInteractive ? 'pointer-events-auto' : 'pointer-events-none'

    useEffect(() => {
        if (!pinChrome || chromePaused) return
        setChromeVisible(true)
        if (idleRef.current) clearTimeout(idleRef.current)
    }, [pinChrome, chromePaused])

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="relative w-full min-h-screen bg-gradient-to-b from-gray-900 to-black">
                {backdropUrl && (
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-30"
                        style={{ backgroundImage: `url(${backdropUrl})` }}
                    />
                )}
                <div className="player-stage relative w-full">
                    <div className="player-video">{children}</div>

                    {!chromePaused && (
                        <div className="player-hit-zones">
                            <div
                                className="absolute top-0 left-0 z-40 h-16 w-44"
                                onMouseEnter={revealChrome}
                                onMouseMove={revealChrome}
                                onTouchStart={revealChrome}
                            />
                            {onNext && (
                                <div
                                    className="absolute top-0 right-0 z-40 h-16 w-52"
                                    onMouseEnter={revealChrome}
                                    onMouseMove={revealChrome}
                                    onTouchStart={revealChrome}
                                />
                            )}
                        </div>
                    )}

                    <div
                        className={`player-chrome z-50 ${fadeClass} ${
                            chromePaused
                                ? 'player-chrome-paused'
                                : chromeInteractive
                                  ? 'player-chrome-on'
                                  : 'player-chrome-off'
                        }`}
                    >
                        <div className="player-chrome-inner">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <button
                                    type="button"
                                    onClick={onBack}
                                    className={`${chromeBtnClass} ${interactive}`}
                                    aria-label="Indietro"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Indietro
                                </button>
                                {title && (
                                    <p className="min-w-0 flex-1 truncate text-sm text-white/70">
                                        {title}
                                    </p>
                                )}
                                {onNext && (
                                    <button
                                        type="button"
                                        onClick={onNext}
                                        className={`${chromeBtnClass} ml-auto ${interactive}`}
                                        aria-label={
                                            nextLabel
                                                ? `Prossima ${nextLabel}`
                                                : 'Puntata successiva'
                                        }
                                    >
                                        Prossima
                                        {nextLabel ? ` ${nextLabel}` : ''}
                                        <SkipForward className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {footer}
        </div>
    )
}
