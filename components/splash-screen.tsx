'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SplashScreenProps {
    isReady: boolean
    minDuration?: number
    maxDuration?: number
    onDismissed?: () => void
}

export function SplashScreen({
    isReady,
    minDuration = 2800,
    maxDuration = 7000,
    onDismissed,
}: SplashScreenProps) {
    const [progress, setProgress] = useState(26)
    const [isFadingOut, setIsFadingOut] = useState(false)
    const [isFinished, setIsFinished] = useState(false)

    const startTimeRef = useRef<number>(Date.now())
    const completingRef = useRef(false)

    const completeAndDismiss = useCallback(() => {
        if (completingRef.current) return
        completingRef.current = true

        // Fa terminare il caricamento della barra rapidamente verso il 100%
        setProgress(100)

        // Non appena tocca il 100%, svanisce immediatamente senza fermarsi
        setTimeout(() => {
            setIsFadingOut(true)
            onDismissed?.()

            setTimeout(() => {
                setIsFinished(true)
            }, 300)
        }, 200)
    }, [onDismissed])

    // Avanzamento fluido della barra durante il caricamento (si arresta prima del 100%)
    useEffect(() => {
        startTimeRef.current = Date.now()

        const interval = setInterval(() => {
            if (completingRef.current) return

            const elapsed = Date.now() - startTimeRef.current
            const ratio = Math.min(elapsed / minDuration, 1)
            // Sale fluidamente fino all'80% massimo, lasciando il completamento solo all'OK
            const target = Math.min(Math.round(ratio * 64) + 26, 82)

            setProgress((prev) => (target > prev ? target : prev))
        }, 40)

        // Safety timeout per reti lente
        const safetyTimer = setTimeout(() => {
            completeAndDismiss()
        }, maxDuration)

        return () => {
            clearInterval(interval)
            clearTimeout(safetyTimer)
        }
    }, [minDuration, maxDuration, completeAndDismiss])

    // Sincronizzazione: non appena arriva l'OK e il tempo minimo è trascorso, completa la barra e svanisce
    useEffect(() => {
        if (completingRef.current) return

        if (isReady) {
            const elapsed = Date.now() - startTimeRef.current
            const remaining = Math.max(0, minDuration - elapsed)

            const timer = setTimeout(() => {
                completeAndDismiss()
            }, remaining)

            return () => clearTimeout(timer)
        }
    }, [isReady, minDuration, completeAndDismiss])

    if (isFinished) {
        return null
    }

    return (
        <AnimatePresence>
            <motion.div
                key="splash-overlay"
                className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center select-none pointer-events-auto"
                initial={{ opacity: 1 }}
                animate={{ opacity: isFadingOut ? 0 : 1 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
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

                <div className="w-48 h-0.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-white/80 rounded-full transition-all duration-200 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
