'use client'

import { ReactNode } from 'react'
import { PlayerChromeProvider } from '@/components/player-chrome-context'

interface PlayerShellProps {
    backdropPath?: string | null
    onBack: () => void
    onNext?: () => void
    nextLabel?: string
    title?: string
    chromePaused?: boolean
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

    return (
        <PlayerChromeProvider
            value={{ onBack, onNext, nextLabel, title, pinChrome, chromePaused }}
        >
            <div className="min-h-screen bg-black text-white">
                <div className="relative h-dvh w-full bg-black">
                    {backdropUrl && (
                        <div
                            className="absolute inset-0 bg-cover bg-center opacity-30"
                            style={{ backgroundImage: `url(${backdropUrl})` }}
                        />
                    )}
                    <div className="relative z-10 h-full w-full">{children}</div>
                </div>
                {footer}
            </div>
        </PlayerChromeProvider>
    )
}
