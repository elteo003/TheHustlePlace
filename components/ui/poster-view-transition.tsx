'use client'

import { useReducedMotion } from 'framer-motion'
import { ContentType } from '@/lib/content-navigation'
import { getPosterTransitionName } from '@/lib/view-transitions'
import { cn } from '@/lib/utils'

interface PosterViewTransitionProps {
    type: ContentType
    id: number
    children: React.ReactNode
    className?: string
}

/** Wrapper che assegna view-transition-name al poster per morph verso /movie o /series */
export function PosterViewTransition({
    type,
    id,
    children,
    className,
}: PosterViewTransitionProps) {
    const reduceMotion = useReducedMotion()

    return (
        <div
            className={cn(className)}
            style={
                reduceMotion
                    ? undefined
                    : { viewTransitionName: getPosterTransitionName(type, id) }
            }
        >
            {children}
        </div>
    )
}
