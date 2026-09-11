'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ContentType, getContentId } from '@/lib/content-navigation'
import { resolveContentType } from '@/lib/content-display'
import { livingDetailsPath, livingPlayerPath } from '@/tv/lib/paths'
import { TvRailItem } from '@/tv/lib/types'
import { TvHero } from '@/tv/components/TvHero'
import { TvNav } from '@/tv/components/TvNav'
import { TvRow } from '@/tv/components/TvRow'
import { WatchHistoryEntry } from '@/lib/watch-history'

interface TvRowData {
    title: string
    items: TvRailItem[]
    type?: ContentType
}

interface TvBrowseProps {
    rows: TvRowData[]
    continueWatching?: WatchHistoryEntry[]
}

export function TvBrowse({ rows, continueWatching = [] }: TvBrowseProps) {
    const router = useRouter()
    const [hero, setHero] = useState<TvRailItem | null>(rows[0]?.items[0] ?? null)
    const [heroType, setHeroType] = useState<ContentType | undefined>(rows[0]?.type)

    const historyItems = useMemo(
        () =>
            continueWatching.map((entry) => ({
                id: entry.id,
                tmdb_id: entry.id,
                title: entry.title,
                name: entry.title,
                overview: '',
                poster_path: entry.poster_path ?? undefined,
                backdrop_path: entry.backdrop_path ?? undefined,
                contentType: entry.type,
                type: entry.type,
            })) as TvRailItem[],
        [continueWatching]
    )

    function openDetails(id: number, type: ContentType) {
        router.push(livingDetailsPath(id, type))
    }

    function play(id: number, type: ContentType) {
        const entry = continueWatching.find((item) => item.id === id && item.type === type)
        router.push(
            livingPlayerPath(id, type, {
                season: entry?.season,
                episode: entry?.episode,
                startAt: entry?.currentTime,
            })
        )
    }

    function peek(id: number, type: ContentType, items: TvRailItem[], fallback?: ContentType) {
        const item = items.find((candidate) => getContentId(candidate) === id)
        if (!item) return
        setHero(item)
        setHeroType(resolveContentType(item, fallback ?? type))
    }

    return (
        <div className="flex min-h-screen flex-col gap-8">
            <TvNav />
            <TvHero item={hero} type={heroType} onPlay={play} onDetails={openDetails} />
            <div className="flex flex-col gap-10">
                {historyItems.length > 0 && (
                    <TvRow
                        title="Continua a guardare"
                        items={historyItems}
                        onSelect={openDetails}
                        onPeek={(id, type) => peek(id, type, historyItems)}
                    />
                )}
                {rows.map((row) => (
                    <TvRow
                        key={row.title}
                        title={row.title}
                        items={row.items}
                        type={row.type}
                        onSelect={openDetails}
                        onPeek={(id, type) => peek(id, type, row.items, row.type)}
                    />
                ))}
            </div>
        </div>
    )
}
