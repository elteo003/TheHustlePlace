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

                        {/* On-Card Content: Pure typographical hierarchy, no AI-slop boxes */}
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
                                    {/* Eyebrow: Season, Episode & Countdown - Pure typography, no rounded box */}
                                    <div className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-white/75 mb-2.5 flex flex-wrap items-center gap-2 drop-shadow">
                                        <span className="text-white font-black tracking-wider">
                                            {featured.nextEpisode.countdownBadge}
                                        </span>
                                        <span className="text-white/40">•</span>
                                        <span className="text-white/80 font-semibold tracking-wide">
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
                                    className="group relative flex flex-col rounded-2xl overflow-hidden aspect-[16/10] bg-zinc-950 text-left border border-white/10 hover:border-white hover:shadow-[0_0_18px_rgba(255,255,255,0.4),0_20px_35px_-10px_rgba(0,0,0,0.9)] cursor-pointer transition-all duration-200"
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
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                                    {/* Content bottom: at rest ONLY the title, on hover the extra info smoothly expands */}
                                    <div className="absolute inset-x-0 bottom-0 p-3.5 z-10 flex flex-col justify-end">
                                        <p className="text-xs sm:text-sm font-black uppercase tracking-tight text-white line-clamp-1 drop-shadow-md">
                                            {item.name}
                                        </p>

                                        {/* Expandable info on hover */}
                                        <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] opacity-0 group-hover:opacity-100">
                                            <div className="overflow-hidden pt-1">
                                                <p className="text-[11px] font-semibold text-white/90 line-clamp-1 flex items-center gap-1.5 drop-shadow">
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
