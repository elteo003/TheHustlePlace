'use client'

import { useCallback, useEffect, useState } from 'react'
import { getWatchHistory, WatchHistoryEntry } from '@/lib/watch-history'

export function useWatchHistory() {
    const [entries, setEntries] = useState<WatchHistoryEntry[]>([])

    const refresh = useCallback(async () => {
        try {
            const response = await fetch('/api/watch-history')
            if (response.ok) {
                const data = (await response.json()) as {
                    configured?: boolean
                    entries?: WatchHistoryEntry[]
                }
                if (data.configured && Array.isArray(data.entries) && data.entries.length > 0) {
                    setEntries(data.entries)
                    return
                }
                if (data.configured && Array.isArray(data.entries)) {
                    setEntries(data.entries)
                    return
                }
            }
        } catch {
            // fallback locale
        }
        setEntries(getWatchHistory())
    }, [])

    useEffect(() => {
        void refresh()
        const handler = () => {
            void refresh()
        }
        window.addEventListener('watch-history-updated', handler)
        window.addEventListener('storage', handler)
        return () => {
            window.removeEventListener('watch-history-updated', handler)
            window.removeEventListener('storage', handler)
        }
    }, [refresh])

    return { entries, refresh }
}
