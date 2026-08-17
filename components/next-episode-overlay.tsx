'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Play } from 'lucide-react'

const COUNTDOWN_S = 8

interface NextEpisodeOverlayProps {
    season: number
    episode: number
    title: string
    overview?: string
    stillUrl?: string | null
    onPlayNow: () => void
    onCancel: () => void
}

export function NextEpisodeOverlay({
    season,
    episode,
    title,
    overview,
    stillUrl,
    onPlayNow,
    onCancel,
}: NextEpisodeOverlayProps) {
    const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_S)

    useEffect(() => {
        const tick = setInterval(() => {
            setSecondsLeft((prev) => Math.max(prev - 1, 0))
        }, 1000)
        const go = setTimeout(onPlayNow, COUNTDOWN_S * 1000)
        return () => {
            clearInterval(tick)
            clearTimeout(go)
        }
    }, [onPlayNow])

    return (
        <div className="absolute inset-0 z-30 flex items-end justify-end bg-gradient-to-t from-black via-black/50 to-transparent p-8 md:p-12">
            <div className="w-full max-w-md">
                <p className="text-xs uppercase tracking-[0.18em] text-white/50 mb-3">
                    Prossimo episodio
                </p>
                <div className="flex gap-4 mb-5">
                    {stillUrl && (
                        <div className="relative w-36 aspect-video rounded-md overflow-hidden flex-shrink-0 bg-zinc-900">
                            <Image
                                src={stillUrl}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="144px"
                            />
                        </div>
                    )}
                    <div className="min-w-0">
                        <p className="text-sm text-white/50 mb-1">
                            S{season}E{episode}
                        </p>
                        <h3 className="text-lg font-semibold text-white leading-snug line-clamp-2">
                            {title}
                        </h3>
                        {overview && (
                            <p className="text-sm text-white/55 mt-1 line-clamp-2">{overview}</p>
                        )}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onPlayNow}
                    className="relative w-full overflow-hidden rounded-md h-12 mb-3"
                >
                    <span className="absolute inset-0 bg-white/15" />
                    <span
                        className="absolute inset-0 bg-white origin-left next-ep-fill"
                        style={{ animationDuration: `${COUNTDOWN_S}s` }}
                    />
                    <span className="relative z-10 flex items-center justify-center gap-2 font-semibold mix-blend-difference text-white">
                        <Play className="w-4 h-4 fill-current" />
                        Prossimo episodio
                        <span className="tabular-nums w-5 text-right">{secondsLeft}</span>
                    </span>
                </button>

                <button
                    type="button"
                    onClick={onCancel}
                    className="w-full text-sm text-white/50 hover:text-white transition-colors py-1"
                >
                    Annulla
                </button>
            </div>
        </div>
    )
}
