'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

let hasAnimatedThisSession = false

interface SplashScreenProps {
    isReady: boolean
    minDuration?: number
    maxDuration?: number
    onFinished?: () => void
}

export function SplashScreen({
    isReady,
    minDuration = 3000,
    maxDuration = 7000,
    onFinished,
}: SplashScreenProps) {
    const [shouldRender, setShouldRender] = useState(!hasAnimatedThisSession)
    const [isFadingOut, setIsFadingOut] = useState(false)
    const [progress, setProgress] = useState(0)

    const startTimeRef = useRef<number>(Date.now())
    const dismissTriggeredRef = useRef(false)

    const dismiss = useCallback(() => {
        if (dismissTriggeredRef.current) return
        dismissTriggeredRef.current = true
        hasAnimatedThisSession = true
        setProgress(100)
        setIsFadingOut(true)

        setTimeout(() => {
            setShouldRender(false)
            onFinished?.()
        }, 340)
    }, [onFinished])

    // Progressione armoniosa della barra
    useEffect(() => {
        if (!shouldRender) return

        startTimeRef.current = Date.now()

        const progressInterval = setInterval(() => {
            if (dismissTriggeredRef.current) return
            const elapsed = Date.now() - startTimeRef.current
            const targetRatio = Math.min(elapsed / minDuration, 1)
            // Sale fluidamente fino all'88% in attesa che il contenuto sia pronto
            const calculatedProgress = isReady ? 100 : Math.min(Math.round(targetRatio * 88), 88)
            setProgress((prev) => Math.max(prev, calculatedProgress))
        }, 40)

        const safetyTimer = setTimeout(() => {
            dismiss()
        }, maxDuration)

        return () => {
            clearInterval(progressInterval)
            clearTimeout(safetyTimer)
        }
    }, [shouldRender, minDuration, maxDuration, isReady, dismiss])

    // Sincronizzazione: sblocca solo quando isReady è true E minDuration è trascorsa
    useEffect(() => {
        if (!shouldRender || dismissTriggeredRef.current) return

        if (isReady) {
            const elapsed = Date.now() - startTimeRef.current
            const remaining = Math.max(0, minDuration - elapsed)

            const timer = setTimeout(() => {
                setProgress(100)
                setTimeout(dismiss, 140)
            }, remaining)

            return () => clearTimeout(timer)
        }
    }, [shouldRender, isReady, minDuration, dismiss])

    if (!shouldRender) {
        return null
    }

    return (
        <AnimatePresence>
            <motion.div
                key="splash-overlay"
                className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center select-none"
                initial={{ opacity: 1 }}
                animate={{ opacity: isFadingOut ? 0 : 1 }}
                transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
                style={{ pointerEvents: isFadingOut ? 'none' : 'auto' }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col items-center"
                >
                    <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mb-6 shadow-lg shadow-white/10">
                        <span className="text-black font-bold text-2xl">H</span>
                    </div>
                    <h1 className="text-2xl font-semibold text-white tracking-tight mb-1">
                        TheHustlePlace
                    </h1>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-10">
                        Streaming
                    </p>
                </motion.div>

                <motion.div
                    className="w-48 h-0.5 bg-white/10 rounded-full overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <div
                        className="h-full bg-white/80 rounded-full transition-all duration-150 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </motion.div>

                <button
                    type="button"
                    onClick={dismiss}
                    className="mt-8 text-sm text-white/50 hover:text-white transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded px-3 py-1 cursor-pointer"
                >
                    Salta
                </button>
            </motion.div>
        </AnimatePresence>
    )
}
