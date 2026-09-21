'use client'

import { useEffect, useState } from 'react'
import { useWatchHistory } from '@/hooks/useWatchHistory'
import { HistorySeed, PersonalRails, TASTE_MIN_HISTORY } from '@/lib/personal-rails'
import { Top10Content } from '@/types'

interface UsePersonalRailsOptions {
    initial: PersonalRails
    occupied: Array<{ id: number; type?: 'movie' | 'tv' }>
}

export function usePersonalRails({ initial, occupied }: UsePersonalRailsOptions): PersonalRails {
    const { entries } = useWatchHistory()
    const [rails, setRails] = useState(initial)

    const occupiedKey = occupied.map((item) => `${item.type || 'movie'}:${item.id}`).join(',')

    useEffect(() => {
        setRails(initial)
    }, [initial])

    useEffect(() => {
        if (initial.personalized || entries.length < TASTE_MIN_HISTORY) {
            return
        }

        const payload = {
            entries: entries.map(
                (entry): HistorySeed => ({
                    id: entry.id,
                    type: entry.type,
                    progress: entry.progress,
                    watchedAt: entry.watchedAt,
                })
            ),
            occupied: occupied.map((item) => ({
                id: item.id,
                type: (item.type || 'movie') as 'movie' | 'tv',
            })),
        }

        let cancelled = false
        void fetch('/api/catalog/personal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
            .then((response) => response.json())
            .then((data: { success?: boolean; data?: PersonalRails }) => {
                if (cancelled || !data.success || !data.data) {
                    return
                }
                setRails(data.data)
            })
            .catch(() => undefined)

        return () => {
            cancelled = true
        }
    }, [entries, initial.personalized, occupiedKey])

    return rails
}

export function occupiedFromRails(items: Top10Content[]): Array<{ id: number; type?: 'movie' | 'tv' }> {
    return items.map((item) => ({ id: item.id, type: item.type }))
}
