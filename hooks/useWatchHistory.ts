'use client'

import { useCallback, useEffect, useState } from 'react'
import { getWatchHistory, WatchHistoryEntry } from '@/lib/watch-history'

export function useWatchHistory() {
    const [entries, setEntries] = useState<WatchHistoryEntry[]>([])

    const refresh = useCallback(() => {
        setEntries(getWatchHistory())
    }, [])

    useEffect(() => {
        refresh()
        const handler = () => refresh()
        window.addEventListener('watch-history-updated', handler)
        window.addEventListener('storage', handler)
        return () => {
            window.removeEventListener('watch-history-updated', handler)
            window.removeEventListener('storage', handler)
        }
    }, [refresh])

    return { entries, refresh }
}
