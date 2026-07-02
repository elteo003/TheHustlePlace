/** Easing curves — snappy, restrained (motion.dev / Linear-style). */
export const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)'
export const EASE_SPRING = 'cubic-bezier(0.32, 0.72, 0, 1)'

export const DURATION = {
    fast: 0.15,
    normal: 0.25,
    slow: 0.4,
} as const

export const springTransition = {
    type: 'spring' as const,
    stiffness: 400,
    damping: 30,
    mass: 0.8,
}

export const fadeUp = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 4 },
    transition: { duration: DURATION.normal, ease: [0.16, 1, 0.3, 1] },
}
