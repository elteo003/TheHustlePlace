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
        <section className="content-gutter py-8">
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
                    <div
                        className="relative rounded-2xl overflow-hidden aspect-[16/9] sm:aspect-[16/10] lg:aspect-auto lg:h-full min-h-[360px] sm:min-h-[440px] bg-zinc-950 border border-white/10 shadow-2xl select-none group/hero"
                        onMouseEnter={() => setIsPaused(true)}
                        onMouseLeave={() => setIsPaused(false)}
                    >
                        {/* Backdrop Crossfade with micro-drift */}
                        <AnimatePresence initial={false}>
                            <motion.div
                                key={featured.id}
                                initial={{ opacity: 0, scale: 0.985 }}
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
                                {/* Cinematic gradient vignettes for pristine text legibility without mud */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/25 to-transparent hidden sm:block" />
                            </motion.div>
                        </AnimatePresence>

                        {/* On-Card Content: Zero descriptions, zero stars, pure cinematic typography */}
                        <div className="absolute inset-0 p-5 sm:p-7 flex flex-col justify-end pointer-events-none">
                            <AnimatePresence mode="popLayout" initial={false}>
                                <motion.div
                                    key={featured.id}
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -14 }}
                                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                                    className="pointer-events-auto"
                                >
                                    {/* Eyebrow: Season, Episode & Countdown */}
                                    <div className="text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-white/70 mb-2 flex items-center gap-2">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-white/95 font-medium">
                                            <Calendar className="w-3 h-3 text-white/70" />
                                            {featured.nextEpisode.countdownBadge}
                                        </span>
                                        <span className="text-white/40">•</span>
                                        <span>
                                            S{featured.nextEpisode.season} E{featured.nextEpisode.episode}
                                            {featured.nextEpisode.name ? ` • "${featured.nextEpisode.name}"` : ''}
                                        </span>
                                    </div>

                                    {/* Big Bold Uppercase Title */}
                                    <h3 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-none drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)]">
                                        {featured.name}
                                    </h3>

                                    {/* Primary Action Button */}
                                    <div className="mt-4 sm:mt-5 flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => handleWatch(featured)}
                                            className="btn-play inline-flex items-center justify-center gap-2 h-10 sm:h-11 px-6 text-xs sm:text-sm font-semibold active:scale-[0.97] transition-all shadow-xl"
                                        >
                                            <Play className="w-3.5 h-3.5 fill-current play-mark-pulse" />
                                            {featured.nextEpisode.isAvailable ? 'Guarda ora' : 'Guarda serie'}
                                        </button>

                                        <span className="text-xs font-medium text-white/60 drop-shadow">
                                            {featured.nextEpisode.isAvailable
                                                ? 'Disponibile ora'
                                                : `Uscita: ${featured.nextEpisode.formattedDate}`}
                                        </span>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Bottom progress line - same luminous pure white as lateral scrollbar, freezes only when hovering the card */}
                        <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white/15 overflow-hidden z-20">
                            {items.length > 1 && (
                                <div
                                    key={`progress-${cycleKey}`}
                                    style={{
                                        animation: `thpProgress ${CYCLE_MS}ms linear forwards`,
                                        animationPlayState: isPaused ? 'paused' : 'running',
                                    }}
                                    className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.45)]"
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
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                    onMouseEnter={() => setIsPaused(true)}
                                    onMouseLeave={() => setIsPaused(false)}
                                    onClick={() => {
                                        const originalIndex = items.findIndex((it) => it.id === item.id)
                                        if (originalIndex !== -1) {
                                            selectItem(originalIndex)
                                        }
                                    }}
                                    className="group relative flex flex-col rounded-2xl overflow-hidden aspect-[16/10] bg-zinc-900 text-left border border-white/10 hover:border-white/40 cursor-pointer shadow-lg transition-colors"
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
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                                    {/* Status badge top-left */}
                                    <div className="absolute top-2 left-2 z-10">
                                        <span className="inline-flex items-center gap-1 rounded-md bg-black/75 border border-white/15 px-2 py-0.5 text-[10px] font-semibold text-white/90 backdrop-blur-md">
                                            {item.nextEpisode.countdownBadge}
                                        </span>
                                    </div>

                                    {/* Title & Episode info bottom - no star ratings, no genre pills */}
                                    <div className="absolute inset-x-0 bottom-0 p-3 z-10">
                                        <p className="text-xs sm:text-sm font-bold uppercase tracking-tight text-white line-clamp-1 group-hover:text-white/95 transition-colors">
                                            {item.name}
                                        </p>
                                        <p className="text-[11px] text-white/60 mt-0.5 line-clamp-1 font-medium">
                                            S{item.nextEpisode.season} • Episodio {item.nextEpisode.episode}
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
