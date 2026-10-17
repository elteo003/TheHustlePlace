'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Calendar, Info } from 'lucide-react'
import { UpcomingTVShowItem } from '@/lib/tv-upcoming'
import { getContentPosterUrl } from '@/lib/content-display'
import { getPlayerPath } from '@/lib/content-navigation'
import { cn } from '@/lib/utils'

const CYCLE_MS = 6000

interface UpcomingTVSectionProps {
    items: UpcomingTVShowItem[]
    onPlay?: (id: number, type: 'tv') => void
    onDetails?: (id: number, type: 'tv') => void
}

export function UpcomingTVSection({ items, onPlay, onDetails }: UpcomingTVSectionProps) {
    const router = useRouter()
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [isPaused, setIsPaused] = useState(false)
    const [cycleKey, setCycleKey] = useState(0)

    const remainingTimeRef = useRef(CYCLE_MS)
    const lastStartTimeRef = useRef(Date.now())

    const nextSlide = useCallback(() => {
        if (!items || items.length <= 1) return
        setSelectedIndex((prev) => (prev + 1) % items.length)
        setCycleKey((k) => k + 1)
        remainingTimeRef.current = CYCLE_MS
        lastStartTimeRef.current = Date.now()
    }, [items])

    const selectItem = useCallback((index: number) => {
        setSelectedIndex(index)
        setCycleKey((k) => k + 1)
        remainingTimeRef.current = CYCLE_MS
        lastStartTimeRef.current = Date.now()
    }, [])

    useEffect(() => {
        if (!items || items.length <= 1) return

        if (isPaused) {
            // Deduct elapsed time from remaining
            const elapsed = Date.now() - lastStartTimeRef.current
            remainingTimeRef.current = Math.max(300, remainingTimeRef.current - elapsed)
            return
        }

        lastStartTimeRef.current = Date.now()
        const timer = setTimeout(() => {
            nextSlide()
        }, remainingTimeRef.current)

        return () => clearTimeout(timer)
    }, [isPaused, cycleKey, nextSlide, items])

    if (!items || items.length === 0) return null

    // Safe clamped index
    const safeIndex = selectedIndex >= 0 && selectedIndex < items.length ? selectedIndex : 0
    const featured = items[safeIndex] ?? items[0]

    // 2x2 grid shows the other items (up to 4)
    const gridItems = items.filter((item) => item.id !== featured.id).slice(0, 4)
    const hasGrid = gridItems.length > 0

    const handleWatch = (item: UpcomingTVShowItem) => {
        if (onPlay) {
            onPlay(item.id, 'tv')
            return
        }
        router.push(
            getPlayerPath(item.id, 'tv', {
                season: item.nextEpisode.season,
                episode: item.nextEpisode.episode,
            })
        )
    }

    const handleDetails = (item: UpcomingTVShowItem) => {
        if (onDetails) {
            onDetails(item.id, 'tv')
            return
        }
        router.push(`/series/${item.id}`)
    }

    return (
        <section
            className="content-gutter py-8"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <style>{`
                @keyframes thpProgress {
                    from { width: 0%; }
                    to { width: 100%; }
                }
            `}</style>

            <h2 className="section-title mb-5">
                Serie TV In Arrivo
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-stretch">
                {/* Featured Hero Card (Left ~60% or 100% if no grid) */}
                <div
                    className={cn(
                        'flex flex-col',
                        hasGrid ? 'lg:col-span-7 xl:col-span-7' : 'lg:col-span-12'
                    )}
                >
                    <div className="relative rounded-2xl overflow-hidden aspect-[16/9] sm:aspect-[16/10] lg:aspect-auto lg:h-full min-h-[360px] sm:min-h-[440px] bg-zinc-950 border border-white/10 shadow-2xl select-none">
                        <AnimatePresence initial={false}>
                            <motion.div
                                key={featured.id}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.01 }}
                                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                                className="absolute inset-0"
                            >
                                <Image
                                    src={getContentPosterUrl(
                                        featured.backdropPath || featured.posterPath,
                                        'w780'
                                    )}
                                    alt={featured.name}
                                    fill
                                    priority
                                    className="object-cover"
                                    sizes="(max-width: 1024px) 100vw, 60vw"
                                />
                                {/* Cinematic Gradient Vignette */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/30 to-transparent hidden sm:block" />

                                {/* Featured Content Overlay (Directly on card) */}
                                <div className="absolute inset-0 p-5 sm:p-7 flex flex-col justify-end">
                                    <div className="flex flex-wrap items-center gap-2 mb-2.5">
                                        <span className="inline-flex items-center gap-1 rounded-full bg-black/60 border border-white/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400 backdrop-blur-md">
                                            ★ {featured.voteAverage}
                                        </span>

                                        <span className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/20 px-2.5 py-0.5 text-[11px] font-medium text-white/90 backdrop-blur-md">
                                            <Calendar className="w-3 h-3 text-white/70" />
                                            S{featured.nextEpisode.season} E{featured.nextEpisode.episode} •{' '}
                                            {featured.nextEpisode.countdownBadge}
                                        </span>
                                    </div>

                                    <h3 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white leading-tight drop-shadow-md">
                                        {featured.name}
                                    </h3>

                                    {featured.overview && (
                                        <p className="mt-2 text-xs sm:text-sm text-white/80 line-clamp-2 max-w-xl leading-relaxed drop-shadow">
                                            {featured.overview}
                                        </p>
                                    )}

                                    <div className="mt-4 sm:mt-5 flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => handleWatch(featured)}
                                            className="btn-play inline-flex items-center justify-center gap-2 h-11 px-6 text-sm font-semibold active:scale-[0.98] transition-transform duration-150"
                                        >
                                            <Play className="w-4 h-4 fill-current play-mark-pulse" />
                                            {featured.nextEpisode.isAvailable ? 'Guarda ora' : 'Guarda'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleDetails(featured)}
                                            className="btn-ghost-outline inline-flex items-center justify-center gap-2 h-11 px-5 text-sm font-medium"
                                        >
                                            <Info className="w-4 h-4" />
                                            Dettagli
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {/* Bottom subtle progress line - tracks the 6-second auto cycle */}
                        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10 overflow-hidden z-20">
                            {items.length > 1 && (
                                <div
                                    key={`progress-${cycleKey}`}
                                    style={{
                                        animation: `thpProgress ${CYCLE_MS}ms linear forwards`,
                                        animationPlayState: isPaused ? 'paused' : 'running',
                                    }}
                                    className="h-full bg-white/60"
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* 2x2 Grid of Upcoming Shows (Right ~40%) */}
                {hasGrid && (
                    <div className="lg:col-span-5 xl:col-span-5">
                        <div className="grid grid-cols-2 gap-3 sm:gap-4 h-full">
                            {gridItems.map((item) => (
                                <motion.button
                                    key={item.id}
                                    layout
                                    type="button"
                                    whileHover={{ scale: 1.025 }}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                    onClick={() => {
                                        const originalIndex = items.findIndex((it) => it.id === item.id)
                                        if (originalIndex !== -1) {
                                            selectItem(originalIndex)
                                        }
                                    }}
                                    className="group relative flex flex-col rounded-2xl overflow-hidden aspect-[16/10] bg-zinc-900 text-left border border-white/10 hover:border-white/30 cursor-pointer shadow-lg"
                                    aria-label={`Visualizza ${item.name}`}
                                >
                                    <Image
                                        src={getContentPosterUrl(
                                            item.backdropPath || item.posterPath,
                                            'w780'
                                        )}
                                        alt={item.name}
                                        fill
                                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                                        sizes="(max-width: 1024px) 50vw, 20vw"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />

                                    {/* Status badge top-left */}
                                    <div className="absolute top-2 left-2 z-10">
                                        <span className="inline-flex items-center gap-1 rounded-md bg-black/75 border border-white/20 px-2 py-0.5 text-[10px] font-semibold text-white/90 backdrop-blur-md">
                                            {item.nextEpisode.countdownBadge}
                                        </span>
                                    </div>

                                    {/* Title & Metadata bottom */}
                                    <div className="absolute inset-x-0 bottom-0 p-3 z-10">
                                        <p className="text-xs sm:text-sm font-bold text-white line-clamp-1 group-hover:text-white/90 transition-colors">
                                            {item.name}
                                        </p>
                                        <p className="text-[11px] text-white/60 mt-0.5 flex items-center gap-1.5">
                                            <span className="text-amber-400 font-semibold">
                                                ★ {item.voteAverage}
                                            </span>
                                            {item.genres.length > 0 && (
                                                <>
                                                    <span className="text-white/30">•</span>
                                                    <span className="line-clamp-1">{item.genres[0]}</span>
                                                </>
                                            )}
                                        </p>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    )
}
