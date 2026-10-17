'use client'

import Image from 'next/image'
import { Play, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { updateContinueEntry, WatchHistoryEntry } from '@/lib/watch-history'
import { getContentPosterUrl } from '@/lib/content-display'
import { getPlayerPath } from '@/lib/content-navigation'
import { resumeStartAt } from '@/lib/watch-progress'
import { CustomScrollbar } from '@/components/custom-scrollbar'
import { TastePrompt } from '@/components/taste-prompt'
import { FeedbackMoment, Liking, WouldContinue } from '@/lib/taste-ranker'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

type ContinueSheet =
    | { kind: 'dismiss'; entry: WatchHistoryEntry }
    | { kind: 'seen'; entry: WatchHistoryEntry; moment: FeedbackMoment; season: number }

function closingAsk(entry: WatchHistoryEntry): { moment: FeedbackMoment; season: number } {
    if (entry.type === 'tv') {
        return { moment: 'end_season', season: entry.season ?? 0 }
    }
    return { moment: 'end_movie', season: 0 }
}

async function hasClosingFeedback(entry: WatchHistoryEntry): Promise<boolean> {
    const ask = closingAsk(entry)
    const response = await fetch(
        `/api/taste/feedback?tmdbId=${entry.id}&type=${entry.type}&season=${ask.season}&moment=${ask.moment}`
    )
    const data = (await response.json()) as { answered?: boolean }
    return Boolean(data.answered)
}

async function saveFeedback(input: {
    entry: WatchHistoryEntry
    moment: FeedbackMoment
    season: number
    liking: Liking
    wouldContinue?: WouldContinue | null
}) {
    await fetch('/api/taste/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            tmdbId: input.entry.id,
            type: input.entry.type,
            season: input.season,
            moment: input.moment,
            liking: input.liking,
            wouldContinue: input.wouldContinue ?? null,
        }),
    }).catch(() => undefined)
}

interface ContinueWatchingRowProps {
    entries: WatchHistoryEntry[]
}

export function ContinueWatchingRow({ entries }: ContinueWatchingRowProps) {
    const router = useRouter()
    const [sheet, setSheet] = useState<ContinueSheet | null>(null)
    const [launchingId, setLaunchingId] = useState<string | null>(null)

    function dismissWith(entry: WatchHistoryEntry, liking: 'disliked' | 'not_interested') {
        void saveFeedback({ entry, moment: 'dismiss', season: 0, liking })
        updateContinueEntry(entry.id, entry.type, 'dismiss')
        setSheet(null)
    }

    function handleLaunch(entry: WatchHistoryEntry) {
        const tileKey = `${entry.type}-${entry.id}`
        if (launchingId) return
        setLaunchingId(tileKey)

        const targetUrl = getPlayerPath(entry.id, entry.type, {
            season: entry.season,
            episode: entry.episode,
            startAt: resumeStartAt({
                currentTime: entry.currentTime,
                duration: entry.duration,
                progress: entry.progress,
            }),
        })

        if (typeof document !== 'undefined' && 'startViewTransition' in document) {
            document.startViewTransition(() => {
                router.push(targetUrl)
            })
        } else {
            router.push(targetUrl)
        }

        setTimeout(() => setLaunchingId(null), 3000)
    }

    const visible = entries.filter((entry) => !entry.continueHidden)
    if (visible.length === 0) return null

    return (
        <CustomScrollbar className="pb-4" containerClassName="gap-3">
            {visible.map((entry, index) => {
                const subtitle =
                    entry.type === 'tv' && entry.season != null && entry.episode != null
                        ? `S${entry.season} E${entry.episode}`
                        : entry.type === 'tv'
                          ? 'Serie TV'
                          : 'Film'

                const tileKey = `${entry.type}-${entry.id}`
                const isLaunching = launchingId === tileKey

                return (
                    <motion.div
                        key={tileKey}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
                        whileTap={{ scale: 0.985 }}
                        className={cn(
                            'continue-tile group relative flex-shrink-0 w-[clamp(12.5rem,18vw,22rem)] text-left rounded-lg cursor-pointer select-none transition-transform duration-150',
                            isLaunching && 'is-launching'
                        )}
                    >
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-900 mb-2">
                            <Image
                                src={getContentPosterUrl(entry.backdrop_path || entry.poster_path, 'w780')}
                                alt={entry.title}
                                fill
                                className={cn(
                                    'object-cover transition-all duration-300 group-hover:scale-105',
                                    isLaunching && 'scale-105 brightness-[0.7]'
                                )}
                                sizes="(max-width: 1536px) 220px, 352px"
                            />
                            <div
                                className={cn(
                                    'absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-all duration-300',
                                    isLaunching && 'bg-black/55 backdrop-blur-[1px]'
                                )}
                            />
                            <div className="continue-play-pill">
                                <div className="continue-play-icon">
                                    <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                                </div>
                                <div className="continue-play-script" aria-hidden="true">
                                    <svg viewBox="0 0 68 26" className="w-[68px] h-[26px]">
                                        <path
                                            className="continue-apple-stroke"
                                            pathLength={100}
                                            d="M 4 14.5 C 6 11.5 8 8 9 8 L 7 24 M 7 13 C 9.5 8.5 17 8.5 17 13 C 17 17.5 10.5 18 8 17.5 C 11 17.5 18 18 21 18 C 23.5 18 24.5 7.5 27 4 C 28.2 2.5 29.2 3 28.5 6.5 L 26 18 C 28 18 31 16.5 33.5 12.5 C 31 10.5 27.5 12 27.5 15 C 27.5 18 31.5 18.2 33.5 17.5 L 34.5 11.5 L 34.5 18 C 36.5 18 39.5 16.5 41 12.5 L 42 18 C 42 21.5 40.5 25.5 36.5 25.5 C 33.5 25.5 33.5 22 37.5 19.5 L 46 16"
                                        />
                                    </svg>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleLaunch(entry)}
                                className="absolute inset-0 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                                aria-label={`Continua ${entry.title}`}
                            />
                            <div className="continue-dismiss-zone continue-web-only absolute right-0 top-0 z-30 h-16 w-16 items-start justify-end p-2">
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation()
                                        setSheet({ kind: 'dismiss', entry })
                                    }}
                                    className="continue-dismiss h-7 w-7 items-center justify-center"
                                    aria-label={`Togli ${entry.title} da continua a guardare`}
                                >
                                    <X className="relative z-10 h-3.5 w-3.5" strokeWidth={2.5} />
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation()
                                    const ask = closingAsk(entry)
                                    void hasClosingFeedback(entry)
                                        .then((answered) => {
                                            if (answered) {
                                                updateContinueEntry(entry.id, entry.type, 'seen')
                                                return
                                            }
                                            setSheet({ kind: 'seen', entry, ...ask })
                                        })
                                        .catch(() => setSheet({ kind: 'seen', entry, ...ask }))
                                }}
                                className="continue-seen continue-web-hit group/seen absolute inset-y-0 right-0 z-20 w-[46%]"
                                aria-label={`Segna ${entry.title} come già visto`}
                            >
                                <span className="continue-shade pointer-events-none absolute inset-0">
                                    <span className="continue-shade-glow" />
                                    <span className="absolute inset-y-0 right-2 flex items-center text-[11px] font-semibold text-black">
                                        Già visto
                                    </span>
                                </span>
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 z-20 h-1 bg-white/20 pointer-events-none">
                                <div
                                    className="h-full bg-white transition-[width] duration-500"
                                    style={{ width: `${entry.progress}%` }}
                                />
                            </div>
                        </div>
                        <p className="text-sm font-medium text-white line-clamp-1 group-hover:text-white/90">
                            {entry.title}
                        </p>
                        <p className="text-xs text-white/50 mt-0.5">
                            {isLaunching ? 'Avvio in corso...' : subtitle}
                        </p>
                    </motion.div>
                )
            })}
            {sheet &&
                createPortal(
                    <div className="fixed inset-0 z-[80]">
                        {sheet.kind === 'dismiss' ? (
                            <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black via-black/70 to-transparent p-8 md:p-12">
                                <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-black/80 p-6 backdrop-blur-sm">
                                    <p className="text-xs uppercase tracking-[0.18em] text-white/45 mb-3">Un attimo</p>
                                    <h3 className="text-2xl font-semibold text-white leading-snug mb-6">
                                        Come mai lo elimini?
                                    </h3>
                                    <div className="flex flex-col gap-2">
                                        <button
                                            type="button"
                                            onClick={() => dismissWith(sheet.entry, 'disliked')}
                                            className="h-12 rounded-md bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
                                        >
                                            Non mi è piaciuto
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => dismissWith(sheet.entry, 'not_interested')}
                                            className="h-12 rounded-md bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
                                        >
                                            Non mi interessa
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSheet(null)}
                                            className="h-12 rounded-md bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
                                        >
                                            L&apos;ho cliccato per sbaglio
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <TastePrompt
                                title={sheet.entry.title}
                                moment={sheet.moment}
                                onSubmit={(liking, wouldContinue) => {
                                    void saveFeedback({
                                        entry: sheet.entry,
                                        moment: sheet.moment,
                                        season: sheet.season,
                                        liking,
                                        wouldContinue,
                                    }).then(() => {
                                        updateContinueEntry(sheet.entry.id, sheet.entry.type, 'seen')
                                        setSheet(null)
                                    })
                                }}
                                onSkip={() => {
                                    void saveFeedback({
                                        entry: sheet.entry,
                                        moment: sheet.moment,
                                        season: sheet.season,
                                        liking: 'skipped',
                                    }).then(() => {
                                        updateContinueEntry(sheet.entry.id, sheet.entry.type, 'seen')
                                        setSheet(null)
                                    })
                                }}
                            />
                        )}
                    </div>,
                    document.body
                )}
        </CustomScrollbar>
    )
}
