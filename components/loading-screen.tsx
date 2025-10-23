'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface LoadingScreenProps {
  onComplete: () => void
  duration?: number // Durata totale dell'animazione in ms
}

export function LoadingScreen({ onComplete, duration = 3000 }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [showLogo, setShowLogo] = useState(false)
  const [showText, setShowText] = useState(false)
  const [showProgress, setShowProgress] = useState(false)

  useEffect(() => {
    // Sequenza di animazioni più lunga e fluida
    const timeline = [
      { delay: 0, action: () => setShowLogo(true) },
      { delay: 800, action: () => setShowText(true) },
      { delay: 1500, action: () => setShowProgress(true) },
      { delay: duration, action: onComplete }
    ]

    // Esegui le animazioni in sequenza
    timeline.forEach(({ delay, action }) => {
      setTimeout(action, delay)
    })

    // Simula progresso di caricamento più realistico
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        // Progresso più lento e realistico
        const increment = prev < 30 ? Math.random() * 8 :
                         prev < 70 ? Math.random() * 12 :
                         Math.random() * 6
        return prev + increment
      })
    }, 150)

    return () => clearInterval(progressInterval)
  }, [onComplete, duration])

  return (
    <div className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20 animate-pulse" />
        <div className="absolute inset-0 bg-[url('/images/dots.svg')] bg-repeat opacity-5" />
      </div>

      {/* Logo H */}
      <div className="relative mb-8">
        <div className="w-24 h-24 mx-auto relative">
          {/* H Letter */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center shadow-2xl loading-logo">
              <span className="text-4xl font-bold text-white">H</span>
            </div>
          </div>

          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg blur-xl opacity-50 animate-pulse" />
        </div>
      </div>

      {/* Text */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={showText ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-4 loading-fade-up"
      >
        TheHustlePlace
      </motion.h1>

      {/* Progress Bar */}
      <div className={`mt-12 transition-all duration-1000 delay-1000 transform ${
        showProgress
          ? 'translate-y-0 opacity-100'
          : 'translate-y-4 opacity-0'
      }`}>
        <div className="w-80 h-1 bg-gray-800 rounded-full overflow-hidden mx-auto">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-300 ease-out loading-progress"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Loading Dots */}
      <div className={`mt-8 transition-all duration-1000 delay-1500 transform ${showProgress
          ? 'translate-y-0 opacity-100'
          : 'translate-y-4 opacity-0'
        } flex space-x-2 text-gray-500`}>
        <span className="animate-bounce delay-100">.</span>
        <span className="animate-bounce delay-200">.</span>
        <span className="animate-bounce delay-300">.</span>
      </div>
    </div>
  )
}
