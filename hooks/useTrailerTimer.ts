'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface UseTrailerTimerProps {
    trailer: string | null
    onTrailerEnded: () => void
    timerDuration?: number // Durata del timer prima di mostrare i prossimi film
}

interface UseTrailerTimerReturn {
    trailerEnded: boolean
    setTrailerEnded: (ended: boolean) => void
    resetTimer: () => void
}

export const useTrailerTimer = ({
    trailer,
    onTrailerEnded,
    timerDuration = 90000 // 90 secondi di default
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

    // Timer semplice: quando il trailer parte, dopo timerDuration millisecondi mostra i prossimi film
    useEffect(() => {
        if (!trailer) {
            resetTimer()
            return
        }

        // Reset stato quando cambia il trailer
        setTrailerEnded(false)

        // Avvia timer
        timerRef.current = setTimeout(() => {
            setTrailerEnded(true)
            onTrailerEnded()
        }, timerDuration)

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current)
                timerRef.current = null
            }
        }
    }, [trailer, onTrailerEnded, timerDuration, resetTimer])

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

