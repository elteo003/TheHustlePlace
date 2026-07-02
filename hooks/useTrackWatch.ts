'use client'

import { useEffect, useRef } from 'react'
import { trackWatchEntry, TrackWatchInput } from '@/lib/watch-history'

/** Registra una visione quando i metadati del titolo sono disponibili. */
export function useTrackWatch(input: TrackWatchInput | null) {
    const tracked = useRef<string | null>(null)

    useEffect(() => {
        if (!input?.title || !input.id) return
        const key = `${input.type}-${input.id}-${input.season ?? 0}-${input.episode ?? 0}`
        if (tracked.current === key) return
        tracked.current = key
        trackWatchEntry(input)
    }, [input])
}
