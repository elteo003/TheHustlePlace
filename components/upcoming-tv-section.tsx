'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Play } from 'lucide-react'
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
        <section className="content-gutter py-3 sm:py-6 overflow-hidden">
            <style>{`
                @keyframes thpProgress {
                    from { width: 0%; }
                    to { width: 100%; }
                }
            `}</style>

            <h2 className="section-title mb-2.5 sm:mb-4">
                Serie TV In Arrivo
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-4 lg:gap-5 items-stretch min-w-0">
                {/* Featured Hero Card (Left ~60% or 100% if no grid) */}
                <div
                    className={cn(
                        'flex flex-col min-w-0 w-full',
                        hasGrid ? 'lg:col-span-7 xl:col-span-7' : 'lg:col-span-12'
                    )}
                >
                    <div
                        className="relative w-full rounded-xl sm:rounded-2xl overflow-hidden aspect-video sm:aspect-[16/9] lg:aspect-auto lg:h-full lg:min-h-[440px] bg-zinc-950 border border-white/10 shadow-2xl select-none group/hero"
                        onMouseEnter={() => setIsPaused(true)}
                        onMouseLeave={() => setIsPaused(false)}
                    >
                        {/* Backdrop Crossfade with Emil Kowalski 2px blur bridge */}
                        <AnimatePresence initial={false}>
                            <motion.div
                                key={featured.id}
                                initial={{ opacity: 0, scale: 0.985, filter: 'blur(3px)' }}
                                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, scale: 1.01, filter: 'blur(3px)' }}
                                transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
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
                                {/* Cinematic gradient vignettes for pristine text legibility */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/25 to-transparent hidden sm:block" />
                            </motion.div>
                        </AnimatePresence>

                        {/* On-Card Content */}
                        <div className="absolute inset-0 p-3 sm:p-6 lg:p-7 flex flex-col justify-end pointer-events-none">
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
                                    <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white/75 mb-1 sm:mb-2 flex flex-wrap items-center gap-1 sm:gap-1.5 drop-shadow">
                                        <span className="text-white font-black tracking-wide shrink-0">
                                            {featured.nextEpisode.countdownBadge}
                                        </span>
                                        <span className="text-white/40 shrink-0">•</span>
                                        <span className="text-white/80 font-semibold tracking-wide truncate">
                                            S{featured.nextEpisode.season} E{featured.nextEpisode.episode}
                                            {featured.nextEpisode.name ? ` • "${featured.nextEpisode.name}"` : ''}
                                        </span>
                                    </div>

                                    {/* Bold Title */}
                                    <h3 className="text-lg sm:text-2xl md:text-3xl lg:text-5xl font-black uppercase tracking-tight text-white leading-tight line-clamp-2 break-words drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)]">
                                        {featured.name}
                                    </h3>

                                    {/* Primary Action Button & Air Date */}
                                    <div className="mt-2 sm:mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
                                        <button
                                            type="button"
                                            onClick={() => handleWatch(featured)}
                                            className="btn-play inline-flex items-center justify-center gap-1.5 sm:gap-2 h-7 sm:h-10 px-3 sm:px-5 text-xs sm:text-sm font-semibold active:scale-[0.97] transition-all shadow-xl shrink-0"
                                        >
                                            <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current play-mark-pulse" />
                                            {featured.nextEpisode.isAvailable ? 'Guarda ora' : 'Guarda serie'}
                                        </button>

                                        <span className="text-[10px] sm:text-xs font-medium text-white/70 drop-shadow truncate">
                                            {featured.nextEpisode.isAvailable
                                                ? 'Disponibile ora'
                                                : `Uscita: ${featured.nextEpisode.formattedDate}`}
                                        </span>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Bottom progress line */}
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
                    <div className="lg:col-span-5 xl:col-span-5 min-w-0 w-full">
                        <div className={cn('grid gap-2 sm:gap-3.5 h-full', gridItems.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
                            {gridItems.map((item) => (
                                <motion.button
                                    key={item.id}
                                    type="button"
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
                                    className="group relative flex flex-col rounded-xl sm:rounded-2xl overflow-hidden aspect-[16/10] bg-zinc-950 text-left border border-white/10 hover:border-white hover:shadow-[0_0_18px_rgba(255,255,255,0.4),0_20px_35px_-10px_rgba(0,0,0,0.9)] cursor-pointer transition-all duration-200 min-w-0 w-full"
                                    aria-label={`Visualizza ${item.name}`}
                                >
                                    <Image
                                        src={getContentPosterUrl(
                                            item.backdropPath || item.posterPath,
                                            'w780'
                                        )}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 1024px) 50vw, 20vw"
                                    />
                                    {/* Pure gradient without muddy gray coloring */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />

                                    {/* Content bottom */}
                                    <div className="absolute inset-x-0 bottom-0 p-2 sm:p-3.5 z-10 flex flex-col justify-end">
                                        <p className="text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-tight text-white line-clamp-1 drop-shadow-md">
                                            {item.name}
                                        </p>

                                        {/* Info: always visible in compact form on mobile, expandable on desktop hover */}
                                        <div className="grid grid-rows-[1fr] sm:grid-rows-[0fr] sm:group-hover:grid-rows-[1fr] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                                            <div className="overflow-hidden pt-0.5 sm:pt-1">
                                                <p className="text-[8.5px] sm:text-[11px] font-semibold text-white/90 line-clamp-1 flex items-center gap-1 sm:gap-1.5 drop-shadow">
                                                    <span className="text-white font-bold">{item.nextEpisode.countdownBadge}</span>
                                                    <span className="text-white/40">•</span>
                                                    <span className="text-white/70">S{item.nextEpisode.season} E{item.nextEpisode.episode}</span>
                                                </p>
                                            </div>
                                        </div>
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
