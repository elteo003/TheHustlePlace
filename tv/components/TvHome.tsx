'use client'

import { ContentType } from '@/lib/content-navigation'
import { useWatchHistory } from '@/hooks/useWatchHistory'
import { TvBrowse } from '@/tv/components/TvBrowse'
import { TvRailItem } from '@/tv/lib/types'

interface TvHomeProps {
    rows: Array<{
        title: string
        items: TvRailItem[]
        type?: ContentType
    }>
}

export function TvHome({ rows }: TvHomeProps) {
    const { entries } = useWatchHistory()
    return <TvBrowse rows={rows} continueWatching={entries} />
}
