'use client'

import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface PlayerShellProps {
    backdropPath?: string | null
    onBack: () => void
    children: ReactNode
    footer?: ReactNode
}

export function PlayerShell({ backdropPath, onBack, children, footer }: PlayerShellProps) {
    const backdropUrl =
        backdropPath && backdropPath !== '/placeholder-movie.svg'
            ? `https://image.tmdb.org/t/p/original${backdropPath}`
            : undefined

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="absolute top-0 left-0 right-0 z-50 p-6">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBack}
                    className="text-white hover:bg-white/20"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Indietro
                </Button>
            </div>

            <div className="relative w-full min-h-screen bg-gradient-to-b from-gray-900 to-black">
                {backdropUrl && (
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-30"
                        style={{ backgroundImage: `url(${backdropUrl})` }}
                    />
                )}
                <div className="relative w-full h-screen">{children}</div>
            </div>

            {footer}
        </div>
    )
}
