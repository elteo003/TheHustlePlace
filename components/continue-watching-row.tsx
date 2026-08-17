'use client'

import Image from 'next/image'
import { Play } from 'lucide-react'
import { motion } from 'framer-motion'
import { WatchHistoryEntry } from '@/lib/watch-history'
import { getContentPosterUrl } from '@/lib/content-display'
import { getPlayerPath } from '@/lib/content-navigation'
import { CustomScrollbar } from '@/components/custom-scrollbar'
import { useRouter } from 'next/navigation'

interface ContinueWatchingRowProps {
    entries: WatchHistoryEntry[]
}

export function ContinueWatchingRow({ entries }: ContinueWatchingRowProps) {
    const router = useRouter()

    if (entries.length === 0) return null

    return (
        <CustomScrollbar className="pb-4" containerClassName="gap-3">
            {entries.map((entry, index) => {
                const subtitle =
                    entry.type === 'tv' && entry.season != null && entry.episode != null
                        ? `S${entry.season} E${entry.episode}`
                        : entry.type === 'tv'
                          ? 'Serie TV'
                          : 'Film'

                return (
                    <motion.button
                        key={`${entry.type}-${entry.id}`}
                        type="button"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
                        onClick={() =>
                            router.push(
                                getPlayerPath(entry.id, entry.type, {
                                    season: entry.season,
                                    episode: entry.episode,
                                })
                            )
                        }
                        className="flex-shrink-0 w-[200px] sm:w-[220px] text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-lg"
                        aria-label={`Continua ${entry.title}`}
                    >
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-900 mb-2">
                            <Image
                                src={getContentPosterUrl(entry.backdrop_path || entry.poster_path, 'w780')}
                                alt={entry.title}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                sizes="220px"
                            />
                            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <span className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                                    <Play className="w-4 h-4 fill-current ml-0.5" />
                                </span>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
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
                    </motion.button>
                )
            })}
        </CustomScrollbar>
    )
}
