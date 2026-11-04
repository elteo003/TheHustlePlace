'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

let hasAnimatedGlobal = false
let appReadyDispatched = false

export function notifyAppReady() {
    appReadyDispatched = true
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('thp:app-ready'))
    }
}

export function SplashScreen() {
    // Se ha già animato in questa sessione SPA, non ripete
    const [shouldShow, setShouldShow] = useState(() => !hasAnimatedGlobal)
    const [progress, setProgress] = useState(0)
    const [isFadingOut, setIsFadingOut] = useState(false)
    const [isFinished, setIsFinished] = useState(false)

    const isReadyRef = useRef(false)
    const startTimeRef = useRef<number>(Date.now())
    const completingRef = useRef(false)

    // Completamento: porta la barra al 100% visibile e poi dissolve
    const finishLoading = useCallback(() => {
        if (completingRef.current) return
        completingRef.current = true
        hasAnimatedGlobal = true

        // 1. Fa avanzare fluidamente la barra fino al 100%
        setProgress(100)

        // 2. Breve pausa con barra al 100% visibile prima di dissolvere
        setTimeout(() => {
            setIsFadingOut(true)
            setTimeout(() => {
                setIsFinished(true)
            }, 360)
        }, 240)
    }, [])

    const handleReady = useCallback(() => {
        isReadyRef.current = true
        const elapsed = Date.now() - startTimeRef.current
        const MIN_TIME = 2400

        if (elapsed >= MIN_TIME) {
            finishLoading()
        } else {
            // Aspetta che scada il tempo minimo prima di completare al 100%
            setTimeout(finishLoading, MIN_TIME - elapsed)
        }
    }, [finishLoading])

    useEffect(() => {
        if (!shouldShow) return

        startTimeRef.current = Date.now()

        window.addEventListener('thp:app-ready', handleReady)

        // Se l'app era già pronta prima dell'aggancio del listener
        if (appReadyDispatched) {
            handleReady()
        }

        // Timer di avanzamento continuo della barra
        const interval = setInterval(() => {
            if (completingRef.current) return

            const elapsed = Date.now() - startTimeRef.current

            // Curva fluida continua:
            // 0 -> 48% nei primi 1.2s
            // 48 -> 74% a 2.4s
            // 74 -> 86% a 4.0s
            // Rallenta dolcemente ("al massimo rallenta") se i contenuti tardano, fino a 93% max
            let target: number
            if (elapsed < 1200) {
                target = Math.round((elapsed / 1200) * 48)
            } else if (elapsed < 2400) {
                target = 48 + Math.round(((elapsed - 1200) / 1200) * 26)
            } else if (elapsed < 4000) {
                target = 74 + Math.round(((elapsed - 2400) / 1600) * 12)
            } else {
                target = Math.min(86 + Math.round(((elapsed - 4000) / 2500) * 7), 93)
            }

            setProgress((prev) => (target > prev ? target : prev))
        }, 30)

        // Safety fallback per pagine senza Hero o problemi di rete (max 6.5s)
        const safetyTimer = setTimeout(() => {
            finishLoading()
        }, 6500)

        return () => {
            window.removeEventListener('thp:app-ready', handleReady)
            clearInterval(interval)
            clearTimeout(safetyTimer)
        }
    }, [shouldShow, handleReady, finishLoading])

    if (!shouldShow || isFinished) {
        return null
    }

    return (
        <AnimatePresence>
            <motion.div
                key="global-splash-overlay"
                className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center select-none pointer-events-auto"
                initial={{ opacity: 1 }}
                animate={{ opacity: isFadingOut ? 0 : 1 }}
                transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
                style={{ pointerEvents: isFadingOut ? 'none' : 'auto' }}
            >
                <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mb-6 shadow-lg shadow-white/10">
                        <span className="text-black font-bold text-2xl">H</span>
                    </div>
                    <h1 className="text-2xl font-semibold text-white tracking-tight mb-1">
                        TheHustlePlace
                    </h1>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-10">
                        Streaming
                    </p>
                </div>

                <div className="w-52 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-white/90 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
