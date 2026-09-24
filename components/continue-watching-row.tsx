'use client'

import Image from 'next/image'
import { Play, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { updateContinueEntry, WatchHistoryEntry } from '@/lib/watch-history'
import { getContentPosterUrl } from '@/lib/content-display'
import { getPlayerPath } from '@/lib/content-navigation'
import { resumeStartAt } from '@/lib/watch-progress'
import { CustomScrollbar } from '@/components/custom-scrollbar'
import { useRouter } from 'next/navigation'

interface ContinueWatchingRowProps {
    entries: WatchHistoryEntry[]
}

export function ContinueWatchingRow({ entries }: ContinueWatchingRowProps) {
    const router = useRouter()

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

                return (
                    <motion.div
                        key={`${entry.type}-${entry.id}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
                        className="continue-tile group relative flex-shrink-0 w-[clamp(12.5rem,18vw,22rem)] text-left rounded-lg"
                    >
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-900 mb-2">
                            <Image
                                src={getContentPosterUrl(entry.backdrop_path || entry.poster_path, 'w780')}
                                alt={entry.title}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                sizes="(max-width: 1536px) 220px, 352px"
                            />
                            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
                            <span className="absolute bottom-3 left-2 z-10 inline-flex items-center gap-1.5 rounded-lg border border-white/30 bg-white/20 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
                                <Play className="h-4 w-4 play-mark-pulse" />
                                Play
                            </span>
                            <button
                                type="button"
                                onClick={() =>
                                    router.push(
                                        getPlayerPath(entry.id, entry.type, {
                                            season: entry.season,
                                            episode: entry.episode,
                                            startAt: resumeStartAt({
                                                currentTime: entry.currentTime,
                                                duration: entry.duration,
                                                progress: entry.progress,
                                            }),
                                        })
                                    )
                                }
                                className="absolute inset-0 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                                aria-label={`Continua ${entry.title}`}
                            />
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation()
                                    updateContinueEntry(entry.id, entry.type, 'dismiss')
                                }}
                                className="continue-dismiss continue-web-only absolute right-2 top-2 z-30 h-7 w-7 items-center justify-center"
                                aria-label={`Togli ${entry.title} da continua a guardare`}
                            >
                                <X className="relative z-10 h-3.5 w-3.5" strokeWidth={2.5} />
                            </button>
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation()
                                    updateContinueEntry(entry.id, entry.type, 'seen')
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
                        <p className="text-xs text-white/50 mt-0.5">{subtitle}</p>
                    </motion.div>
                )
            })}
        </CustomScrollbar>
    )
}
