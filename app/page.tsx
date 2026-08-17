'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

const SPLASH_MS = 400

export default function RootPage() {
    const router = useRouter()
    const [isFadingOut, setIsFadingOut] = useState(false)

    const goHome = useCallback(() => {
        if (isFadingOut) return
        setIsFadingOut(true)
        setTimeout(() => router.push('/home'), 280)
    }, [isFadingOut, router])

    useEffect(() => {
        const timer = setTimeout(goHome, SPLASH_MS)
        return () => clearTimeout(timer)
    }, [goHome])

    return (
        <motion.div
            className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center"
            animate={{ opacity: isFadingOut ? 0 : 1 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
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
                <motion.div
                    className="h-full bg-white/80 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: SPLASH_MS / 1000, ease: 'linear' }}
                />
            </motion.div>

            <button
                type="button"
                onClick={goHome}
                className="mt-8 text-sm text-white/50 hover:text-white transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded px-3 py-1"
            >
                Salta
            </button>
        </motion.div>
    )
}
