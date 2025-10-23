'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface LoadingScreenProps {
  onComplete: () => void
  duration?: number // Durata totale dell'animazione in ms
}

export function LoadingScreen({ onComplete, duration = 5000 }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [showLogo, setShowLogo] = useState(false)
  const [showText, setShowText] = useState(false)
  const [showProgress, setShowProgress] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    // Sequenza di animazioni Netflix-style
    const timeline = [
      { delay: 0, action: () => setShowLogo(true) },
      { delay: 1000, action: () => setShowText(true) },
      { delay: 2000, action: () => setShowProgress(true) },
      { delay: duration - 1000, action: () => setIsComplete(true) },
      { delay: duration, action: onComplete }
    ]

    // Esegui le animazioni in sequenza
    timeline.forEach(({ delay, action }) => {
      setTimeout(action, delay)
    })

    // Simula progresso di caricamento realistico
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        // Progresso più realistico
        const increment = prev < 20 ? Math.random() * 3 :
                         prev < 50 ? Math.random() * 5 :
                         prev < 80 ? Math.random() * 8 :
                         Math.random() * 2
        return prev + increment
      })
    }, 80)

    return () => clearInterval(progressInterval)
  }, [onComplete, duration])

  return (
    <div className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center overflow-hidden">
      {/* Background Netflix-style */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
      
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-blue-600/10 animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)] animate-pulse" />
      </div>

      {/* Logo TheHustlePlace - Netflix style */}
      <motion.div 
        className="relative mb-12"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={showLogo ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        <div className="relative">
          {/* Main Logo Container */}
          <div className="relative w-32 h-32 mx-auto">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur-2xl opacity-60 animate-pulse" />
            
            {/* Logo Box */}
            <div className="relative w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
              {/* H Letter */}
              <span className="text-6xl font-black text-white drop-shadow-lg">H</span>
            </div>
            
            {/* Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-2xl animate-shine" />
          </div>
        </div>
      </motion.div>

      {/* Text - Netflix style */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={showText ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
        className="text-center mb-16"
      >
        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-blue-400 mb-4 tracking-wider">
          TheHustlePlace
        </h1>
        <div className="text-lg text-gray-400 font-light tracking-widest">
          STREAMING PREMIUM
        </div>
      </motion.div>

      {/* Progress Bar - Netflix style */}
      <motion.div 
        className="w-96 max-w-md mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={showProgress ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="relative">
          {/* Background */}
          <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
            {/* Progress Fill */}
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-full relative"
              style={{ width: `${Math.min(progress, 100)}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {/* Shine effect on progress */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full animate-shine" />
            </motion.div>
          </div>
          
          {/* Progress percentage */}
          <div className="text-center mt-4">
            <span className="text-sm text-gray-400 font-mono">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </motion.div>

      {/* Loading indicator */}
      <motion.div 
        className="mt-8 flex items-center space-x-2"
        initial={{ opacity: 0 }}
        animate={showProgress ? { opacity: 1 } : {}}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
      </motion.div>

      {/* Fade out effect when complete */}
      {isComplete && (
        <motion.div
          className="absolute inset-0 bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
      )}
    </div>
  )
}
