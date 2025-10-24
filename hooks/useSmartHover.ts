'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

interface UseSmartHoverProps {
    onHoverStart?: () => void
    onHoverEnd?: () => void
    hoverDelay?: number
}

interface UseSmartHoverReturn {
    isHovered: boolean
    handleMouseEnter: () => void
    handleMouseLeave: () => void
}

export const useSmartHover = ({
    onHoverStart,
    onHoverEnd,
    hoverDelay = 500 // 500ms invece di 2000ms
}: UseSmartHoverProps = {}): UseSmartHoverReturn => {
    const [isHovered, setIsHovered] = useState(false)
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const handleMouseEnter = useCallback(() => {
        // Pulisci timeout precedente
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current)
            hoverTimeoutRef.current = null
        }

        setIsHovered(true)
        onHoverStart?.()
    }, [onHoverStart])

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false)

        // Riavvia autoplay dopo delay ridotto
        hoverTimeoutRef.current = setTimeout(() => {
            onHoverEnd?.()
        }, hoverDelay)
    }, [onHoverEnd, hoverDelay])

    // Cleanup al dismount
    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current)
            }
        }
    }, [])

    return {
        isHovered,
        handleMouseEnter,
        handleMouseLeave
    }
}
