'use client'

import { useEffect, useState } from 'react'

export type ScrollInputDevice = 'mouse' | 'touchpad' | 'touch'

export function classifyWheelEvent(event: {
    deltaMode: number
    deltaX: number
    deltaY: number
}): 'mouse' | 'touchpad' {
    // DeltaMode 1 (lines) o 2 (pages) esiste solo sui mouse fisici tradizionali (es. Windows / Firefox)
    if (event.deltaMode !== 0) {
        return 'mouse'
    }

    // Touchpad (Windows Precision, macOS Trackpad) emette valori continui subpixel/frazionari
    const isSubpixelY = Math.abs(event.deltaY) > 0 && Math.abs(event.deltaY) % 1 !== 0
    const isSubpixelX = Math.abs(event.deltaX) > 0 && Math.abs(event.deltaX) % 1 !== 0
    if (isSubpixelY || isSubpixelX) {
        return 'touchpad'
    }

    // Gesto a due dita su touchpad produce quasi sempre una componente orizzontale o piccoli delta pixel continui
    if (Math.abs(event.deltaX) > 0 && Math.abs(event.deltaX) < 50) {
        return 'touchpad'
    }

    // Piccolo delta continuo (tipico dei micro-movimenti del trackpad)
    if (Math.abs(event.deltaY) > 0 && Math.abs(event.deltaY) < 30) {
        return 'touchpad'
    }

    // Rotella fisica tradizionale: scatti discreti di 40-120px (multipli di notch) rigorosamente su asse Y
    if (event.deltaX === 0 && Math.abs(event.deltaY) >= 40 && event.deltaY % 1 === 0) {
        return 'mouse'
    }

    return 'mouse'
}

export function useScrollInputDevice() {
    const [device, setDevice] = useState<ScrollInputDevice>('mouse')

    useEffect(() => {
        // Se è un dispositivo touch puro (telefono/tablet senza mouse)
        const isTouchScreen =
            typeof window !== 'undefined' &&
            (window.matchMedia('(pointer: coarse)').matches ||
                (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1 && window.innerWidth < 1024))

        if (isTouchScreen) {
            setDevice('touch')
            return
        }

        // Su desktop con puntatore fine (pointer: fine), default iniziale a mouse
        const handleWheel = (event: WheelEvent) => {
            const detected = classifyWheelEvent(event)
            setDevice((current) => (current !== detected ? detected : current))
        }

        window.addEventListener('wheel', handleWheel, { passive: true })
        return () => window.removeEventListener('wheel', handleWheel)
    }, [])

    return {
        device,
        hasMouseWheel: device === 'mouse',
        isTouchpad: device === 'touchpad',
        isTouch: device === 'touch',
    }
}
