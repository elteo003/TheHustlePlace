'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Calendar } from 'lucide-react'
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

export function UpcomingTVSection({ items, onPlay }: UpcomingTVSectionProps) {
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
                {/* Featured Hero Card with Emil Kowalski floating white HUD */}
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
                                className="absolute inset-0 cursor-pointer"
                                onClick={() => handleWatch(featured)}
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
                                {/* Cinematic vignette */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent hidden sm:block" />
                            </motion.div>
                        </AnimatePresence>

                        {/* Floating White HUD Card (Il Riquadro Bianco) */}
                        <div
                            className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-20 w-[calc(100%-2rem)] sm:w-auto min-w-[280px] sm:min-w-[340px] max-w-sm bg-white text-zinc-950 rounded-2xl p-4 sm:p-5 shadow-[0_24px_50px_rgba(0,0,0,0.7)] backdrop-blur-md overflow-hidden select-none"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <AnimatePresence mode="popLayout" initial={false}>
                                <motion.div
                                    key={featured.id}
                                    initial={{ opacity: 0, y: 14, filter: 'blur(3px)' }}
                                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, y: -14, filter: 'blur(3px)' }}
                                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                                >
                                    {/* Micro header info */}
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-black/50">
                                            Prossima uscita
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-black/85 bg-black/[0.06] px-2.5 py-0.5 rounded-full">
                                            <Calendar className="w-3 h-3 text-black/60" />
                                            {featured.nextEpisode.countdownBadge}
                                        </span>
                                    </div>

                                    {/* Vertical text ticker: Series title & release details */}
                                    <h3 className="text-xl sm:text-2xl font-black text-black tracking-tight leading-tight line-clamp-1">
                                        {featured.name}
                                    </h3>
                                    <p className="text-xs sm:text-sm font-medium text-black/60 mt-1 line-clamp-1">
                                        Stagione {featured.nextEpisode.season} • Episodio {featured.nextEpisode.episode}
                                        {featured.nextEpisode.name ? ` • "${featured.nextEpisode.name}"` : ''}
                                    </p>
                                </motion.div>
                            </AnimatePresence>

                            {/* Action button */}
                            <div className="mt-3.5 pt-3 border-t border-black/[0.08] flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={() => handleWatch(featured)}
                                    className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-black text-white hover:bg-black/85 active:scale-[0.97] transition-all text-xs font-semibold shadow-md"
                                >
                                    <Play className="w-3.5 h-3.5 fill-current" />
                                    {featured.nextEpisode.isAvailable ? 'Guarda ora' : 'Guarda serie'}
                                </button>

                                <span className="text-[11px] font-medium text-black/50">
                                    {featured.nextEpisode.isAvailable ? 'Disponibile' : featured.nextEpisode.formattedDate}
                                </span>
                            </div>

                            {/* Bottom timer progress line - freezes on hover without resetting */}
                            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-black/5 overflow-hidden">
                                {items.length > 1 && (
                                    <div
                                        key={`progress-${cycleKey}`}
                                        style={{
                                            animation: `thpProgress ${CYCLE_MS}ms linear forwards`,
                                            animationPlayState: isPaused ? 'paused' : 'running',
                                        }}
                                        className="h-full bg-black/50"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2x2 Grid of Upcoming Shows (Right ~40%) - Pure visual artwork with no text clutter */}
                {hasGrid && (
                    <div className="lg:col-span-5 xl:col-span-5">
                        <div className="grid grid-cols-2 gap-3 sm:gap-4 h-full">
                            {gridItems.map((item) => (
                                <motion.button
                                    key={item.id}
                                    layout
                                    type="button"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                    onClick={() => {
                                        const originalIndex = items.findIndex((it) => it.id === item.id)
                                        if (originalIndex !== -1) {
                                            selectItem(originalIndex)
                                        }
                                    }}
                                    className="group relative flex flex-col rounded-2xl overflow-hidden aspect-[16/10] bg-zinc-900 text-left border border-white/10 hover:border-white/40 cursor-pointer shadow-lg"
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
                                    {/* Clean dark gradient that subtly deepens on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                                    {/* Subtle title only on hover (no text clutter at rest) */}
                                    <div className="absolute inset-x-0 bottom-0 p-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <p className="text-xs sm:text-sm font-semibold text-white line-clamp-1 drop-shadow-md">
                                            {item.name}
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
