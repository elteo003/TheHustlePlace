'use client'

import { useMemo } from 'react'
import { ContentType } from '@/lib/content-navigation'
import { useWatchHistory } from '@/hooks/useWatchHistory'
import { occupiedFromRails, usePersonalRails } from '@/hooks/usePersonalRails'
import { PersonalRails } from '@/lib/personal-rails'
import { TvBrowse } from '@/tv/components/TvBrowse'
import { TvRailItem } from '@/tv/lib/types'
import { Top10Content } from '@/types'

interface TvHomeProps {
    rows: Array<{
        title: string
        items: TvRailItem[]
        type?: ContentType
    }>
    personal?: PersonalRails
    occupied?: Top10Content[]
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
    const personalRows = [
        { title: 'Scelti per te oggi', items: rails.picks as TvRailItem[] },
        ...(rails.affinity.length
            ? [{ title: 'Pensiamo ti appassioneranno', items: rails.affinity as TvRailItem[] }]
            : []),
        { title: 'Tesori per te', items: rails.treasures as TvRailItem[] },
    ].filter((row) => row.items.length > 0)

    const topIndex = next.findIndex((row) => row.title === 'Top 10')
    if (topIndex < 0) {
        return [...personalRows, ...next]
    }

    const scelti = personalRows.filter((row) => row.title === 'Scelti per te oggi')
    const restPersonal = personalRows.filter((row) => row.title !== 'Scelti per te oggi')
    return [
        ...next.slice(0, topIndex),
        ...scelti,
        next[topIndex],
        ...restPersonal,
        ...next.slice(topIndex + 1),
    ]
}

export function TvHome({ rows, personal, occupied = [] }: TvHomeProps) {
    const { entries } = useWatchHistory()
    const rails = usePersonalRails({
        initial: personal ?? { personalized: false, picks: [], affinity: [], treasures: [] },
        occupied: occupiedFromRails(occupied),
    })
    const mergedRows = useMemo(
        () => (personal ? mergePersonalRows(rows, rails) : rows),
        [personal, rails, rows]
    )

    return <TvBrowse rows={mergedRows} continueWatching={entries} />
}
