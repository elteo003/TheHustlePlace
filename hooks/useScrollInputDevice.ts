'use client'

import { useEffect, useRef, useState } from 'react'

export type ScrollInputDevice = 'mouse' | 'touchpad' | 'touch'

export const STORAGE_KEY = 'thp_scroll_device'

export function detectScrollDeviceType(input: {
    deltaMode: number
    deltaX: number
    deltaY: number
    timeDiff?: number
    recentCount?: number
}): ScrollInputDevice {
    // 1. DeltaMode a linee o pagine -> Esclusivo dei mouse tradizionali (Windows/Firefox)
    if (input.deltaMode !== 0) {
        return 'mouse'
    }

    const timeDiff = input.timeDiff ?? 100
    const recentCount = input.recentCount ?? 1

    // 2. Flusso continuo ad altissima frequenza (intervalli < 30ms o sequenza rapida di eventi) -> Trackpad
    if (timeDiff > 0 && timeDiff < 30 && recentCount >= 3) {
        return 'touchpad'
    }

    // 3. Valori frazionari/subpixel -> Trackpad di precisione (Windows Precision o macOS Trackpad)
    const isSubpixelY = Math.abs(input.deltaY) > 0 && Math.abs(input.deltaY) % 1 !== 0
    const isSubpixelX = Math.abs(input.deltaX) > 0 && Math.abs(input.deltaX) % 1 !== 0
    if (isSubpixelY || isSubpixelX) {
        return 'touchpad'
    }

    // 4. Componente orizzontale o micro-delta continuo -> Gesto trackpad
    if (Math.abs(input.deltaX) > 0 && Math.abs(input.deltaX) < 40) {
        return 'touchpad'
    }
    if (Math.abs(input.deltaY) > 0 && Math.abs(input.deltaY) < 30) {
        return 'touchpad'
    }

    // 5. Scatto discreto singolo tipico della rotella del mouse (deltaY elevato >= 40px con scatti isolati)
    if (
        input.deltaX === 0 &&
        Math.abs(input.deltaY) >= 40 &&
        input.deltaY % 1 === 0 &&
        (timeDiff > 50 || timeDiff === 0)
    ) {
        return 'mouse'
    }

    return 'touchpad'
}

export function useScrollInputDevice() {
    // Default a 'touchpad' per evitare che su portatili compaiano le frecce all'avvio prima di aver rilevato una rotella.
    const [device, setDevice] = useState<ScrollInputDevice>(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = sessionStorage.getItem(STORAGE_KEY)
                if (saved === 'mouse' || saved === 'touchpad' || saved === 'touch') {
                    return saved
                }
            } catch {
                // Ignore storage errors
            }
        }
        return 'touchpad'
    })

    const stateRef = useRef({
        lastTime: 0,
        recentCount: 0,
        resetTimer: null as ReturnType<typeof setTimeout> | null,
    })

    useEffect(() => {
        if (typeof window === 'undefined') return

        // Rileva touch screen puro (smartphone/tablet)
        const isTouchScreen =
            window.matchMedia('(pointer: coarse)').matches &&
            !window.matchMedia('(pointer: fine)').matches

        if (isTouchScreen) {
            setDevice('touch')
            return
        }

        const handleWheel = (event: WheelEvent) => {
            const now = performance.now()
            const timeDiff = stateRef.current.lastTime === 0 ? 0 : now - stateRef.current.lastTime
            stateRef.current.lastTime = now

            stateRef.current.recentCount += 1
            if (stateRef.current.resetTimer) clearTimeout(stateRef.current.resetTimer)
            stateRef.current.resetTimer = setTimeout(() => {
                stateRef.current.recentCount = 0
            }, 120)

            const detected = detectScrollDeviceType({
                deltaMode: event.deltaMode,
                deltaX: event.deltaX,
                deltaY: event.deltaY,
                timeDiff,
                recentCount: stateRef.current.recentCount,
            })

            setDevice((current) => {
                if (current !== detected) {
                    try {
                        sessionStorage.setItem(STORAGE_KEY, detected)
                    } catch {
                        // Ignore storage error
                    }
                    return detected
                }
                return current
            })
        }

        window.addEventListener('wheel', handleWheel, { passive: true })
        return () => {
            window.removeEventListener('wheel', handleWheel)
            if (stateRef.current.resetTimer) clearTimeout(stateRef.current.resetTimer)
        }
    }, [])

    return {
        device,
        hasMouseWheel: device === 'mouse',
        isTouchpad: device === 'touchpad',
        isTouch: device === 'touch',
    }
}
