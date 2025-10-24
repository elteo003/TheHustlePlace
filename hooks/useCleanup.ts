'use client'

import { useRef, useEffect } from 'react'

interface UseCleanupReturn {
    addTimeout: (timeout: NodeJS.Timeout) => NodeJS.Timeout
    addInterval: (interval: NodeJS.Timeout) => NodeJS.Timeout
    clearAll: () => void
}

export const useCleanup = (): UseCleanupReturn => {
    const timeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set())
    const intervalsRef = useRef<Set<NodeJS.Timeout>>(new Set())

    const addTimeout = (timeout: NodeJS.Timeout): NodeJS.Timeout => {
        timeoutsRef.current.add(timeout)
        return timeout
    }

    const addInterval = (interval: NodeJS.Timeout): NodeJS.Timeout => {
        intervalsRef.current.add(interval)
        return interval
    }

    const clearAll = () => {
        // Pulisce tutti i timeout
        timeoutsRef.current.forEach(timeout => {
            clearTimeout(timeout)
        })
        timeoutsRef.current.clear()

        // Pulisce tutti gli interval
        intervalsRef.current.forEach(interval => {
            clearInterval(interval)
        })
        intervalsRef.current.clear()
    }

    // Cleanup automatico al dismount
    useEffect(() => {
        return () => {
            clearAll()
        }
    }, [])

    return { addTimeout, addInterval, clearAll }
}
