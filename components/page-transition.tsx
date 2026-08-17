'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useReducedMotion } from '@/hooks/useMediaQuery'
import { DURATION } from '@/lib/motion'

const pageEase = [0.16, 1, 0.3, 1] as const

function isSectionRoute(pathname: string | null): boolean {
    if (!pathname) return false
    return (
        pathname === '/home' ||
        pathname === '/movies' ||
        pathname === '/tv' ||
        pathname === '/catalog'
    )
}

function shouldAnimatePage(pathname: string | null): boolean {
    if (!pathname) return false
    if (pathname === '/') return false
    if (pathname.startsWith('/player/')) return false
    if (pathname.startsWith('/search')) return false
    if (pathname.startsWith('/movie/') || pathname.startsWith('/series/')) return false
    return isSectionRoute(pathname)
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
        <AnimatePresence initial={false} mode="sync">
            <motion.div
                key={pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                    duration: DURATION.fast,
                    ease: pageEase,
                }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    )
}
