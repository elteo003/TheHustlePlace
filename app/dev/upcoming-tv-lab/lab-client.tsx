'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, ArrowLeft, Sliders, Sparkles, Check, Eye } from 'lucide-react'
import { UpcomingTVShowItem } from '@/lib/tv-upcoming'
import { getContentPosterUrl } from '@/lib/content-display'
import { cn } from '@/lib/utils'

// Mock realistic items for the lab
const LAB_ITEMS: UpcomingTVShowItem[] = [
    {
        id: 101,
        name: 'Law & Order - Unità Vittime Speciali',
        overview: '',
        backdropPath: '/3V4kLQg0kSqPLctI5ziAhbAZiip.jpg',
        posterPath: null,
        voteAverage: 8.0,
        genres: ['Crime', 'Drama'],
        isFollowed: true,
        nextEpisode: {
            season: 28,
            episode: 3,
            name: 'Episodio 3',
            overview: '',
            airDate: '2026-10-22',
            daysUntil: 5,
            formattedDate: '22 Ottobre',
            countdownBadge: 'Tra 5 giorni',
            isAvailable: false,
        },
    },
    {
        id: 102,
        name: 'VisionQuest',
        overview: '',
        backdropPath: '/d0t23Q00GqJt9X2f2X8B1tU1A2.jpg',
        posterPath: null,
        voteAverage: 8.4,
        genres: ['Sci-Fi'],
        isFollowed: true,
        nextEpisode: {
            season: 1,
            episode: 3,
            name: 'Il Ritorno',
            overview: '',
            airDate: '2026-10-20',
            daysUntil: 3,
            formattedDate: '20 Ottobre',
            countdownBadge: 'Tra 3 giorni',
            isAvailable: false,
        },
    },
    {
        id: 103,
        name: 'Slow Horses',
        overview: '',
        backdropPath: '/r8UeTq5U1c7U0o0u3k4m5m6.jpg',
        posterPath: null,
        voteAverage: 8.2,
        genres: ['Thriller'],
        isFollowed: true,
        nextEpisode: {
            season: 6,
            episode: 6,
            name: 'Regolamento di Conti',
            overview: '',
            airDate: '2026-10-21',
            daysUntil: 4,
            formattedDate: '21 Ottobre',
            countdownBadge: 'Tra 4 giorni',
            isAvailable: false,
        },
    },
    {
        id: 104,
        name: 'MobLand',
        overview: '',
        backdropPath: '/7WUH0i6Q9WkL1r5g8P0u2.jpg',
        posterPath: null,
        voteAverage: 7.9,
        genres: ['Crime'],
        isFollowed: true,
        nextEpisode: {
            season: 2,
            episode: 6,
            name: 'Episodio 6',
            overview: '',
            airDate: '2026-10-23',
            daysUntil: 6,
            formattedDate: '23 Ottobre',
            countdownBadge: 'Tra 6 giorni',
            isAvailable: false,
        },
    },
    {
        id: 105,
        name: 'I Simpson',
        overview: '',
        backdropPath: '/f5f3e9d8c7b6a5.jpg',
        posterPath: null,
        voteAverage: 8.1,
        genres: ['Animazione'],
        isFollowed: true,
        nextEpisode: {
            season: 38,
            episode: 3,
            name: 'La Casa dell\'Albero',
            overview: '',
            airDate: '2026-10-18',
            daysUntil: 1,
            formattedDate: '18 Ottobre',
            countdownBadge: 'In onda domani',
            isAvailable: false,
        },
    },
]

type HeroOption = 'opt1-pure-typography' | 'opt2-accent-bar' | 'opt3-compact-ticker'
type SmallCardOption = 'optA-title-only' | 'optB-badge-on-hover' | 'optC-bottom-glass-reveal'
type HoverEffectOption = 'optI-white-halo' | 'optII-cinematic-depth' | 'optIII-edge-light'

export function UpcomingTVLabClient() {
    const [heroOption, setHeroOption] = useState<HeroOption>('opt1-pure-typography')
    const [smallCardOption, setSmallCardOption] = useState<SmallCardOption>('optA-title-only')
    const [hoverEffectOption, setHoverEffectOption] = useState<HoverEffectOption>('optI-white-halo')
    const [selectedShow, setSelectedShow] = useState(0)

    const featured = LAB_ITEMS[selectedShow] ?? LAB_ITEMS[0]
    const gridItems = LAB_ITEMS.filter((it) => it.id !== featured.id).slice(0, 4)

    return (
        <div className="min-h-screen bg-black text-white p-6 sm:p-10 font-sans">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-xs font-semibold text-white/60 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Torna all'App
                    </Link>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
                        <Sparkles className="w-3.5 h-3.5" /> Lab Interattivo UI/UX
                    </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
                    Upcoming TV Section — Design Studio
                </h1>
                <p className="text-sm text-white/60 mt-1 max-w-3xl">
                    Confronto interattivo delle opzioni di design basate sui principi di Emil Kowalski (animations.dev). Testa il contrasto, la reattività dell'hover, e le micro-interazioni in tempo reale.
                </p>
            </div>

            {/* Controls Bar */}
            <div className="max-w-7xl mx-auto mb-10 p-5 rounded-2xl bg-zinc-900/80 border border-white/10 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-wider text-white/50">
                    <Sliders className="w-3.5 h-3.5 text-white/70" /> Configurazione Studio
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Control 1: Hero Eyebrow */}
                    <div>
                        <label className="block text-xs font-bold text-white/80 mb-2">
                            1. Eyebrow Card Grande (Data & Countdown)
                        </label>
                        <div className="space-y-1.5">
                            <button
                                type="button"
                                onClick={() => setHeroOption('opt1-pure-typography')}
                                className={cn(
                                    'w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between',
                                    heroOption === 'opt1-pure-typography'
                                        ? 'bg-white text-black font-semibold shadow-md'
                                        : 'bg-zinc-800/60 text-white/70 hover:bg-zinc-800'
                                )}
                            >
                                <span>Opzione 1: Pura Tipografia (No Box)</span>
                                {heroOption === 'opt1-pure-typography' && <Check className="w-3.5 h-3.5" />}
                            </button>
                            <button
                                type="button"
                                onClick={() => setHeroOption('opt2-accent-bar')}
                                className={cn(
                                    'w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between',
                                    heroOption === 'opt2-accent-bar'
                                        ? 'bg-white text-black font-semibold shadow-md'
                                        : 'bg-zinc-800/60 text-white/70 hover:bg-zinc-800'
                                )}
                            >
                                <span>Opzione 2: Accent Bar Verticale</span>
                                {heroOption === 'opt2-accent-bar' && <Check className="w-3.5 h-3.5" />}
                            </button>
                            <button
                                type="button"
                                onClick={() => setHeroOption('opt3-compact-ticker')}
                                className={cn(
                                    'w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between',
                                    heroOption === 'opt3-compact-ticker'
                                        ? 'bg-white text-black font-semibold shadow-md'
                                        : 'bg-zinc-800/60 text-white/70 hover:bg-zinc-800'
                                )}
                            >
                                <span>Opzione 3: Ultra-Minimal Mono-Linea</span>
                                {heroOption === 'opt3-compact-ticker' && <Check className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                    </div>

                    {/* Control 2: Small Cards Info */}
                    <div>
                        <label className="block text-xs font-bold text-white/80 mb-2">
                            2. Informazioni Card Piccole (A riposo vs Hover)
                        </label>
                        <div className="space-y-1.5">
                            <button
                                type="button"
                                onClick={() => setSmallCardOption('optA-title-only')}
                                className={cn(
                                    'w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between',
                                    smallCardOption === 'optA-title-only'
                                        ? 'bg-white text-black font-semibold shadow-md'
                                        : 'bg-zinc-800/60 text-white/70 hover:bg-zinc-800'
                                )}
                            >
                                <span>Opzione A: Solo Titolo + Reveal Hover</span>
                                {smallCardOption === 'optA-title-only' && <Check className="w-3.5 h-3.5" />}
                            </button>
                            <button
                                type="button"
                                onClick={() => setSmallCardOption('optB-badge-on-hover')}
                                className={cn(
                                    'w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between',
                                    smallCardOption === 'optB-badge-on-hover'
                                        ? 'bg-white text-black font-semibold shadow-md'
                                        : 'bg-zinc-800/60 text-white/70 hover:bg-zinc-800'
                                )}
                            >
                                <span>Opzione B: Badge solo all'Hover</span>
                                {smallCardOption === 'optB-badge-on-hover' && <Check className="w-3.5 h-3.5" />}
                            </button>
                            <button
                                type="button"
                                onClick={() => setSmallCardOption('optC-bottom-glass-reveal')}
                                className={cn(
                                    'w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between',
                                    smallCardOption === 'optC-bottom-glass-reveal'
                                        ? 'bg-white text-black font-semibold shadow-md'
                                        : 'bg-zinc-800/60 text-white/70 hover:bg-zinc-800'
                                )}
                            >
                                <span>Opzione C: Striscia Frosted che sale</span>
                                {smallCardOption === 'optC-bottom-glass-reveal' && <Check className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                    </div>

                    {/* Control 3: Hover Style */}
                    <div>
                        <label className="block text-xs font-bold text-white/80 mb-2">
                            3. Stile dell'Hover sulle Card Piccole
                        </label>
                        <div className="space-y-1.5">
                            <button
                                type="button"
                                onClick={() => setHoverEffectOption('optI-white-halo')}
                                className={cn(
                                    'w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between',
                                    hoverEffectOption === 'optI-white-halo'
                                        ? 'bg-white text-black font-semibold shadow-md'
                                        : 'bg-zinc-800/60 text-white/70 hover:bg-zinc-800'
                                )}
                            >
                                <span>Opzione I: Contorno Bianco + Glow Scrollbar</span>
                                {hoverEffectOption === 'optI-white-halo' && <Check className="w-3.5 h-3.5" />}
                            </button>
                            <button
                                type="button"
                                onClick={() => setHoverEffectOption('optII-cinematic-depth')}
                                className={cn(
                                    'w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between',
                                    hoverEffectOption === 'optII-cinematic-depth'
                                        ? 'bg-white text-black font-semibold shadow-md'
                                        : 'bg-zinc-800/60 text-white/70 hover:bg-zinc-800'
                                )}
                            >
                                <span>Opzione II: Ombra Profonda Cinematografica</span>
                                {hoverEffectOption === 'optII-cinematic-depth' && <Check className="w-3.5 h-3.5" />}
                            </button>
                            <button
                                type="button"
                                onClick={() => setHoverEffectOption('optIII-edge-light')}
                                className={cn(
                                    'w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between',
                                    hoverEffectOption === 'optIII-edge-light'
                                        ? 'bg-white text-black font-semibold shadow-md'
                                        : 'bg-zinc-800/60 text-white/70 hover:bg-zinc-800'
                                )}
                            >
                                <span>Opzione III: Bordo Bianco Sottile Sharp</span>
                                {hoverEffectOption === 'optIII-edge-light' && <Check className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* LIVE PREVIEW CANVAS */}
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-white/50 flex items-center gap-2">
                        <Eye className="w-4 h-4 text-white/70" /> Anteprima dal Vivo
                    </span>
                    <span className="text-xs text-white/40">
                        Passa il mouse o clicca sulle card per testare l'interazione
                    </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                    {/* Featured Hero Card */}
                    <div className="lg:col-span-7 xl:col-span-7 flex flex-col">
                        <div className="relative rounded-2xl overflow-hidden min-h-[380px] sm:min-h-[460px] bg-zinc-950 border border-white/10 shadow-2xl select-none group/hero">
                            <AnimatePresence initial={false}>
                                <motion.div
                                    key={featured.id}
                                    initial={{ opacity: 0, scale: 0.985, filter: 'blur(3px)' }}
                                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, scale: 1.01, filter: 'blur(3px)' }}
                                    transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                                    className="absolute inset-0"
                                >
                                    <Image
                                        src={getContentPosterUrl(featured.backdropPath || featured.posterPath, 'w780')}
                                        alt={featured.name}
                                        fill
                                        priority
                                        className="object-cover"
                                        sizes="(max-width: 1024px) 100vw, 60vw"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/25 to-transparent hidden sm:block" />
                                </motion.div>
                            </AnimatePresence>

                            {/* Hero Overlay Content */}
                            <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end pointer-events-none">
                                <div className="pointer-events-auto">
                                    {/* 1. EYEBROW RENDERING BASED ON CHOSEN OPTION */}
                                    {heroOption === 'opt1-pure-typography' && (
                                        <div className="text-xs font-bold uppercase tracking-widest text-white/75 mb-2.5 flex flex-wrap items-center gap-2 drop-shadow">
                                            <span className="text-white font-black tracking-wider">
                                                {featured.nextEpisode.countdownBadge}
                                            </span>
                                            <span className="text-white/40">•</span>
                                            <span className="text-white/80 font-semibold tracking-wide">
                                                S{featured.nextEpisode.season} E{featured.nextEpisode.episode}
                                                {featured.nextEpisode.name ? ` • "${featured.nextEpisode.name}"` : ''}
                                            </span>
                                        </div>
                                    )}

                                    {heroOption === 'opt2-accent-bar' && (
                                        <div className="text-xs font-bold uppercase tracking-widest text-white/85 mb-2.5 flex items-center gap-2.5 drop-shadow">
                                            <span className="w-1 h-3.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
                                            <span className="text-white font-black">{featured.nextEpisode.countdownBadge}</span>
                                            <span className="text-white/40">/</span>
                                            <span className="text-white/80 font-medium">
                                                S{featured.nextEpisode.season} E{featured.nextEpisode.episode}
                                            </span>
                                        </div>
                                    )}

                                    {heroOption === 'opt3-compact-ticker' && (
                                        <div className="text-[11px] font-mono uppercase tracking-wider text-white/60 mb-2 flex items-center gap-2">
                                            <span className="text-white font-bold">{featured.nextEpisode.countdownBadge}</span>
                                            <span>[S{featured.nextEpisode.season}:E{featured.nextEpisode.episode}]</span>
                                        </div>
                                    )}

                                    {/* Big Bold Uppercase Title */}
                                    <h3 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-none drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)]">
                                        {featured.name}
                                    </h3>

                                    {/* Action button */}
                                    <div className="mt-5 flex items-center gap-3">
                                        <button
                                            type="button"
                                            className="btn-play inline-flex items-center justify-center gap-2 h-11 px-6 text-xs sm:text-sm font-semibold active:scale-[0.97] transition-all shadow-xl"
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
                                </div>
                            </div>

                            {/* Bottom scrollbar-colored timing line */}
                            <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white/15 overflow-hidden z-20">
                                <div className="h-full w-2/3 bg-white shadow-[0_0_10px_rgba(255,255,255,0.45)]" />
                            </div>
                        </div>
                    </div>

                    {/* 2x2 Grid of Upcoming Shows */}
                    <div className="lg:col-span-5 xl:col-span-5">
                        <div className="grid grid-cols-2 gap-4 h-full">
                            {gridItems.map((item) => {
                                // Dynamic hover classes based on user option
                                const hoverClasses = cn(
                                    'group relative flex flex-col rounded-2xl overflow-hidden aspect-[16/10] bg-zinc-950 text-left cursor-pointer transition-all duration-200',
                                    hoverEffectOption === 'optI-white-halo' &&
                                        'border border-white/10 hover:border-white hover:shadow-[0_0_18px_rgba(255,255,255,0.4),0_20px_35px_-10px_rgba(0,0,0,0.9)] hover:scale-[1.02] active:scale-[0.98]',
                                    hoverEffectOption === 'optII-cinematic-depth' &&
                                        'border border-white/15 hover:border-white/70 hover:shadow-[0_24px_48px_rgba(0,0,0,0.98)] hover:scale-[1.03] active:scale-[0.98]',
                                    hoverEffectOption === 'optIII-edge-light' &&
                                        'border border-white/10 hover:border-white/80 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_16px_32px_rgba(0,0,0,0.8)] hover:scale-[1.015] active:scale-[0.98]'
                                )

                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => {
                                            const idx = LAB_ITEMS.findIndex((it) => it.id === item.id)
                                            if (idx !== -1) setSelectedShow(idx)
                                        }}
                                        className={hoverClasses}
                                    >
                                        <Image
                                            src={getContentPosterUrl(item.backdropPath || item.posterPath, 'w780')}
                                            alt={item.name}
                                            fill
                                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                                            sizes="(max-width: 1024px) 50vw, 20vw"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                                        {/* OPTION B: Badge that only reveals on hover */}
                                        {smallCardOption === 'optB-badge-on-hover' && (
                                            <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <span className="inline-flex items-center gap-1 rounded-md bg-black/80 border border-white/20 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
                                                    {item.nextEpisode.countdownBadge}
                                                </span>
                                            </div>
                                        )}

                                        {/* Bottom Information Container */}
                                        <div className="absolute inset-x-0 bottom-0 p-3.5 z-10 flex flex-col justify-end">
                                            <p className="text-xs sm:text-sm font-black uppercase tracking-tight text-white line-clamp-1 drop-shadow-md transition-transform duration-200 group-hover:-translate-y-0.5">
                                                {item.name}
                                            </p>

                                            {/* OPTION A: Smooth expansion of extra info */}
                                            {smallCardOption === 'optA-title-only' && (
                                                <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] opacity-0 group-hover:opacity-100">
                                                    <div className="overflow-hidden pt-1">
                                                        <p className="text-[11px] font-semibold text-white/90 line-clamp-1 flex items-center gap-1.5 drop-shadow">
                                                            <span className="text-white font-bold">{item.nextEpisode.countdownBadge}</span>
                                                            <span className="text-white/40">•</span>
                                                            <span className="text-white/70">S{item.nextEpisode.season} E{item.nextEpisode.episode}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* OPTION C: Frosted pill slide-up */}
                                            {smallCardOption === 'optC-bottom-glass-reveal' && (
                                                <div className="mt-1 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
                                                    <span className="inline-block px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] text-white/90 font-medium backdrop-blur-md">
                                                        {item.nextEpisode.countdownBadge} • S{item.nextEpisode.season} E{item.nextEpisode.episode}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
