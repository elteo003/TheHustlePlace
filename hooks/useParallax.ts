'use client'

import { useState, useEffect, useRef } from 'react'

export function useParallax() {
  const [scrollY, setScrollY] = useState(0)
  const parallaxRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>()

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
      rafRef.current = requestAnimationFrame(() => {
        setScrollY(window.pageYOffset)
      })
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  return { parallaxRef, scrollY }
}
