'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface UseTrailerTimerProps {
    trailer: string | null
    onTrailerEnded: () => void
    trailerDuration?: number
    fallbackDuration?: number
}

interface UseTrailerTimerReturn {
    trailerEnded: boolean
    setTrailerEnded: (ended: boolean) => void
    resetTimer: () => void
}

export const useTrailerTimer = ({
    trailer,
    onTrailerEnded,
    trailerDuration = 30000, // 30 secondi per trailer
    fallbackDuration = 15000  // 15 secondi se non c'è trailer
}: UseTrailerTimerProps): UseTrailerTimerReturn => {
    const [trailerEnded, setTrailerEnded] = useState(false)
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    const resetTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }
        setTrailerEnded(false)
    }, [])

    const startTimer = useCallback((duration: number) => {
        console.log(`⏰ Avvio timer per ${duration / 1000} secondi`)

        timerRef.current = setTimeout(() => {
            console.log('🎬 Timer scaduto, trailer finito')
            setTrailerEnded(true)
            onTrailerEnded()
        }, duration)
    }, [onTrailerEnded])

    useEffect(() => {
        // Pulisci timer precedente
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }

        // Reset stato se cambia il trailer
        setTrailerEnded(false)

        if (trailer && !trailerEnded) {
            // Timer per trailer: 30 secondi
            startTimer(trailerDuration)
        } else if (!trailer && !trailerEnded) {
            // Fallback timer: 15 secondi se non c'è trailer
            startTimer(fallbackDuration)
        }

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current)
            }
        }
    }, [trailer, trailerEnded, trailerDuration, fallbackDuration, startTimer])

    // Cleanup al dismount
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current)
            }
        }
    }, [])

    return {
        trailerEnded,
        setTrailerEnded,
        resetTimer
    }
}
