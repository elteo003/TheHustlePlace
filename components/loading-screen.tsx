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

      {/* Logo TheHustlePlace - Elegant Animation */}
      <motion.div 
        className="relative mb-12"
        initial={{ scale: 0, opacity: 0, rotateY: -180 }}
        animate={showLogo ? { 
          scale: 1, 
          opacity: 1, 
          rotateY: 0,
          y: [0, -10, 0]
        } : {}}
        transition={{ 
          duration: 2,
          ease: "easeOut",
          y: {
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }}
      >
        <div className="relative">
          {/* Outer Glow Ring */}
          <motion.div 
            className="absolute inset-0 w-40 h-40 mx-auto -top-4 -left-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <div className="w-full h-full border-2 border-transparent rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 bg-clip-border animate-pulse" />
          </motion.div>

          {/* Middle Glow Ring */}
          <motion.div 
            className="absolute inset-0 w-36 h-36 mx-auto -top-2 -left-2"
            animate={{ rotate: -360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          >
            <div className="w-full h-full border border-transparent rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 bg-clip-border" />
          </motion.div>

          {/* Main Logo Container */}
          <div className="relative w-32 h-32 mx-auto">
            {/* Animated Background Glow */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur-xl"
              animate={{ 
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* Logo Box with 3D Effect */}
            <motion.div 
              className="relative w-full h-full bg-gradient-to-br from-blue-500 via-purple-600 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl"
              animate={{ 
                boxShadow: [
                  "0 0 20px rgba(59, 130, 246, 0.5)",
                  "0 0 40px rgba(147, 51, 234, 0.8)",
                  "0 0 20px rgba(59, 130, 246, 0.5)"
                ]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {/* H Letter with 3D Effect */}
              <motion.span 
                className="text-6xl font-black text-white drop-shadow-2xl"
                animate={{ 
                  textShadow: [
                    "0 0 10px rgba(255, 255, 255, 0.5)",
                    "0 0 20px rgba(255, 255, 255, 0.8)",
                    "0 0 10px rgba(255, 255, 255, 0.5)"
                  ]
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                H
              </motion.span>
            </motion.div>
            
            
            {/* Particle Effects */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white rounded-full"
                style={{
                  left: `${20 + (i * 12)}%`,
                  top: `${20 + (i * 8)}%`,
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                  y: [0, -20, 0]
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.3,
                  repeat: Infinity,
                  repeatDelay: 2
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Text - Elegant Animation */}
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.8 }}
        animate={showText ? { 
          opacity: 1, 
          y: 0, 
          scale: 1 
        } : {}}
        transition={{ 
          duration: 1.5, 
          ease: "easeOut", 
          delay: 0.5 
        }}
        className="text-center mb-16"
      >
        <motion.h1 
          className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-blue-400 mb-4 tracking-wider"
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            backgroundSize: "200% 100%"
          }}
        >
          TheHustlePlace
        </motion.h1>
        
        <motion.div 
          className="text-lg text-gray-400 font-light tracking-widest"
          animate={{
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          STREAMING PREMIUM
        </motion.div>
      </motion.div>

      {/* Progress Bar - Elegant Animation */}
      <motion.div 
        className="w-96 max-w-md mx-auto"
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={showProgress ? { 
          opacity: 1, 
          y: 0, 
          scale: 1 
        } : {}}
        transition={{ 
          duration: 1, 
          ease: "easeOut" 
        }}
      >
        <div className="relative">
          {/* Background with glow */}
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden shadow-inner">
            {/* Progress Fill with animated gradient */}
            <motion.div
              className="h-full rounded-full relative overflow-hidden"
              style={{ width: `${Math.min(progress, 100)}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {/* Animated gradient background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{
                  backgroundSize: "200% 100%"
                }}
              />
              
            </motion.div>
          </div>
          
          {/* Progress percentage with animation */}
          <motion.div 
            className="text-center mt-4"
            animate={{
              scale: [1, 1.05, 1]
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              repeatDelay: 1
            }}
          >
            <span className="text-sm text-gray-400 font-mono bg-gray-800 px-3 py-1 rounded-full">
              {Math.round(progress)}%
            </span>
          </motion.div>
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
