'use client'

import { useState, useRef, useCallback } from 'react'

interface UseSmartHoverOptions {
  delay?: number
  onEnter?: () => void
  onLeave?: () => void
}

export function useSmartHover(options: UseSmartHoverOptions = {}) {
  const [isHovered, setIsHovered] = useState(false)
  const hoverRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const handleMouseEnter = useCallback(() => {
    clearTimeout(timeoutRef.current)
    setIsHovered(true)
    options.onEnter?.()
  }, [options])

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setIsHovered(false)
      options.onLeave?.()
    }, options.delay || 300)
  }, [options])

  // Cleanup timeout on unmount
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  return { 
    isHovered, 
    hoverRef, 
    handleMouseEnter, 
    handleMouseLeave,
    cleanup
  }
}