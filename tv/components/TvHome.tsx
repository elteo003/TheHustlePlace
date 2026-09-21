'use client'

import { useMemo } from 'react'
import { ContentType } from '@/lib/content-navigation'
import { useWatchHistory } from '@/hooks/useWatchHistory'
import { occupiedFromRails, usePersonalRails } from '@/hooks/usePersonalRails'
import { PersonalRails } from '@/lib/personal-rails'
import { weavePlatformTop10s, type PlatformTop10 } from '@/lib/platform-top10'
import { TvBrowse } from '@/tv/components/TvBrowse'
import { TvRailItem } from '@/tv/lib/types'
import { Top10Content } from '@/types'

interface TvHomeProps {
    rows: Array<{
        id?: string
        title: string
        items: TvRailItem[]
        type?: ContentType
    }>
    personal?: PersonalRails
    occupied?: Top10Content[]
    platformTop10?: PlatformTop10
}

function mergePersonalRows(
    rows: TvHomeProps['rows'],
    rails: PersonalRails
): TvHomeProps['rows'] {
    const next = rows.filter(
        (row) =>
            row.title !== 'Scelti per te oggi' &&
            row.title !== 'Pensiamo ti appassioneranno' &&
            row.title !== 'Tesori per te'
    )
    const scelti = rails.picks.length
        ? [{ title: 'Scelti per te oggi', items: rails.picks as TvRailItem[] }]
        : []
    const pensiamo = rails.affinity.length
        ? [{ title: 'Pensiamo ti appassioneranno', items: rails.affinity as TvRailItem[] }]
        : []
    const tesori = rails.treasures.length
        ? [{ title: 'Tesori per te', items: rails.treasures as TvRailItem[] }]
        : []

    const topIndex = next.findIndex((row) => row.title === 'Top 10')
    if (topIndex < 0) {
        return pinComingSoonLast([...scelti, ...pensiamo, ...next, ...tesori])
    }

    const merged = [
        ...next.slice(0, topIndex),
        ...scelti,
        next[topIndex],
        ...pensiamo,
        ...next.slice(topIndex + 1),
    ]
    const afterRecent = merged.findIndex(
        (row) => row.title === 'Serie recenti' || row.title === 'Serie TV Recenti'
    )
    const afterPopular = merged.findIndex(
        (row) => row.title === 'Film popolari' || row.title === 'Film Popolari'
    )
    const insertAt =
        afterRecent >= 0 ? afterRecent + 1 : afterPopular >= 0 ? afterPopular + 1 : topIndex + 1 + pensiamo.length

    return pinComingSoonLast([...merged.slice(0, insertAt), ...tesori, ...merged.slice(insertAt)])
}

function pinComingSoonLast(rows: TvHomeProps['rows']): TvHomeProps['rows'] {
    const coming = rows.filter((row) => row.title === 'In arrivo')
    if (!coming.length) return rows
    return [...rows.filter((row) => row.title !== 'In arrivo'), ...coming]
}

export function TvHome({ rows, personal, occupied = [], platformTop10 }: TvHomeProps) {
    const { entries } = useWatchHistory()
    const rails = usePersonalRails({
        initial: personal ?? { personalized: false, picks: [], affinity: [], treasures: [] },
        occupied: occupiedFromRails(occupied),
    })
    const mergedRows = useMemo(() => {
        const merged = personal ? mergePersonalRows(rows, rails) : rows
        if (!platformTop10) return merged
        return weavePlatformTop10s(merged.map((row) => ({
            id: row.id || row.title,
            title: row.title,
            items: row.items,
            type: row.type,
        })), [
            {
                id: 'platform-top10-tv',
                title: platformTop10.seriesTitle,
                items: platformTop10.series as TvRailItem[],
                type: 'tv' as const,
            },
            {
                id: 'platform-top10-movie',
                title: platformTop10.moviesTitle,
                items: platformTop10.movies as TvRailItem[],
                type: 'movie' as const,
            },
        ])
    }, [personal, rails, rows, platformTop10])

    return <TvBrowse rows={mergedRows} continueWatching={entries} />
}
