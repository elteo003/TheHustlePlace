'use client'

import { useState, useEffect } from 'react'

export function useHeroControls() {
  const [showControls, setShowControls] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)

  // Timer per nascondere controlli quando non c'è interazione
  useEffect(() => {
    if (!isHovered && !isScrolled && !initialLoad) {
      const timeout = setTimeout(() => {
        setShowControls(false)
      }, 1000)
      return () => clearTimeout(timeout)
    }
  }, [isHovered, isScrolled, initialLoad])

  // Gestione scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const heroHeight = window.innerHeight

      if (scrollY < heroHeight) {
        setIsScrolled(false)
      } else {
        setIsScrolled(true)
        setShowControls(true)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Timer per initialLoad
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoad(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  // Logica unificata per visibilità controlli
  const shouldShowControls = isHovered || isScrolled || initialLoad

  // Gestisce la visibilità unificata - più reattiva
  useEffect(() => {
    if (shouldShowControls) {
      setShowControls(true)
    }
  }, [shouldShowControls])

  return {
    showControls,
    setShowControls,
    isHovered,
    setIsHovered,
    isScrolled,
    initialLoad,
    setInitialLoad,
    shouldShowControls
  }
}
