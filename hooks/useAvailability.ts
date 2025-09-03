'use client'

import { useState, useEffect } from 'react'
import { checkRealAvailability, MovieAvailability } from '@/lib/utils'

export function useAvailability(tmdbId: number, type: 'movie' | 'tv', initialBadge: string = 'Disponibile') {
    const [availability, setAvailability] = useState<MovieAvailability>({
        isAvailable: true,
        badge: initialBadge,
        reason: 'Caricamento...'
    })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const checkAvailability = async () => {
            setLoading(true)
            try {
                const result = await checkRealAvailability(tmdbId, type)
                setAvailability(result)
            } catch (error) {
                console.error('Errore nel controllo disponibilità:', error)
                setAvailability({
                    isAvailable: false,
                    badge: 'Non Disponibile',
                    reason: 'Errore nel controllo disponibilità'
                })
            } finally {
                setLoading(false)
            }
        }

        // Solo per film che potrebbero essere disponibili (non "Al Cinema")
        if (initialBadge !== 'Al Cinema') {
            checkAvailability()
        }
    }, [tmdbId, type, initialBadge])

    return { availability, loading }
}
