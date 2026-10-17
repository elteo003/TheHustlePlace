'use client'

import { useSyncExternalStore } from 'react'

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

let cachedDevice: ScrollInputDevice = 'touchpad'
let isInitialized = false
const subscribers = new Set<() => void>()

let lastWheelTime = 0
let recentWheelCount = 0
let wheelResetTimer: ReturnType<typeof setTimeout> | null = null

function getSnapshot(): ScrollInputDevice {
    return cachedDevice
}

function getServerSnapshot(): ScrollInputDevice {
    return 'touchpad'
}

function notifySubscribers() {
    subscribers.forEach((callback) => callback())
}

function initGlobalDeviceListener() {
    if (typeof window === 'undefined' || isInitialized) return
    isInitialized = true

    try {
        const saved = sessionStorage.getItem(STORAGE_KEY)
        if (saved === 'mouse' || saved === 'touchpad' || saved === 'touch') {
            cachedDevice = saved
        }
    } catch {
        // Ignore storage errors
    }

    const isTouchScreen =
        window.matchMedia('(pointer: coarse)').matches &&
        !window.matchMedia('(pointer: fine)').matches

    if (isTouchScreen) {
        cachedDevice = 'touch'
        notifySubscribers()
        return
    }

    const handleWheel = (event: WheelEvent) => {
        const now = performance.now()
        const timeDiff = lastWheelTime === 0 ? 0 : now - lastWheelTime
        lastWheelTime = now

        recentWheelCount += 1
        if (wheelResetTimer) clearTimeout(wheelResetTimer)
        wheelResetTimer = setTimeout(() => {
            recentWheelCount = 0
        }, 120)

        const detected = detectScrollDeviceType({
            deltaMode: event.deltaMode,
            deltaX: event.deltaX,
            deltaY: event.deltaY,
            timeDiff,
            recentCount: recentWheelCount,
        })

        if (detected !== cachedDevice) {
            cachedDevice = detected
            try {
                sessionStorage.setItem(STORAGE_KEY, detected)
            } catch {
                // Ignore storage error
            }
            notifySubscribers()
        }
    }

    window.addEventListener('wheel', handleWheel, { passive: true })
}

function subscribe(callback: () => void) {
    initGlobalDeviceListener()
    subscribers.add(callback)
    return () => {
        subscribers.delete(callback)
    }
}

export function useScrollInputDevice() {
    const device = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

    return {
        device,
        hasMouseWheel: device === 'mouse',
        isTouchpad: device === 'touchpad',
        isTouch: device === 'touch',
    }
}
