'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useReducedMotion } from '@/hooks/useMediaQuery'
import { DURATION } from '@/lib/motion'

const pageEase = [0.16, 1, 0.3, 1] as const

function shouldAnimatePage(pathname: string | null): boolean {
    if (!pathname) return false
    if (pathname === '/' || pathname === '/home') return false
    if (pathname.startsWith('/player/')) return false
    if (pathname.startsWith('/search')) return false
    if (pathname.startsWith('/movies') || pathname.startsWith('/tv') || pathname.startsWith('/catalog')) return false
    if (pathname.startsWith('/movie/') || pathname.startsWith('/series/')) return false
    return true
}

interface PageTransitionProps {
    children: React.ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
    const pathname = usePathname()
    const reduceMotion = useReducedMotion()
    const animate = shouldAnimatePage(pathname)

    if (!animate || reduceMotion) {
        return <>{children}</>
    }

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{
                    duration: DURATION.normal,
                    ease: pageEase,
                }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    )
}
