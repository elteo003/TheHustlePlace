'use client'

import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, SkipForward } from 'lucide-react'
import { useReducedMotion } from '@/hooks/useMediaQuery'

const IDLE_MS = 2500

interface PlayerShellProps {
    backdropPath?: string | null
    onBack: () => void
    onNext?: () => void
    nextLabel?: string
    title?: string
    chromePaused?: boolean
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
        idleRef.current = setTimeout(() => setChromeVisible(false), IDLE_MS)
    }, [chromePaused])

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

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="relative w-full min-h-screen bg-gradient-to-b from-gray-900 to-black">
                {backdropUrl && (
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-30"
                        style={{ backgroundImage: `url(${backdropUrl})` }}
                    />
                )}
                <div className="relative w-full h-screen">
                    {children}

                    {!chromePaused && (
                        <>
                            <div
                                className="absolute top-0 left-0 right-0 h-20 z-40"
                                onMouseEnter={revealChrome}
                                onMouseMove={revealChrome}
                                onTouchStart={revealChrome}
                            />
                            {onNext && (
                                <div
                                    className="absolute top-20 right-0 bottom-0 w-20 z-40"
                                    onMouseEnter={revealChrome}
                                    onMouseMove={revealChrome}
                                    onTouchStart={revealChrome}
                                />
                            )}
                        </>
                    )}

                    <div
                        className={`absolute inset-0 z-50 pointer-events-none ${fadeClass} ${
                            chromeInteractive ? 'opacity-100' : 'opacity-0'
                        }`}
                    >
                        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent px-4 sm:px-6 pt-5 pb-10">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={onBack}
                                    className={`inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/50 px-4 py-2 text-sm font-medium text-white backdrop-blur-md hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                                        chromeInteractive ? 'pointer-events-auto' : 'pointer-events-none'
                                    }`}
                                    aria-label="Indietro"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Indietro
                                </button>
                                {title && (
                                    <p className="min-w-0 truncate text-sm text-white/70">{title}</p>
                                )}
                            </div>
                        </div>

                        {onNext && (
                            <button
                                type="button"
                                onClick={onNext}
                                className={`absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 flex items-center gap-2 rounded-full border border-white/15 bg-black/50 pl-4 pr-3 py-3 text-white backdrop-blur-md hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
                                    chromeInteractive ? 'pointer-events-auto' : 'pointer-events-none'
                                }`}
                                aria-label={nextLabel ? `Puntata successiva ${nextLabel}` : 'Puntata successiva'}
                            >
                                <span className="hidden sm:block text-left">
                                    <span className="block text-[10px] uppercase tracking-[0.16em] text-white/50">
                                        Avanti
                                    </span>
                                    <span className="block text-sm font-medium">{nextLabel ?? 'Puntata'}</span>
                                </span>
                                <SkipForward className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {footer}
        </div>
    )
}
