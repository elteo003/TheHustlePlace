'use client'

import { CSSProperties, ReactNode } from 'react'
import { useReducedMotion } from '@/hooks/useMediaQuery'
import { ContentType } from '@/lib/content-navigation'
import { getPosterTransitionName } from '@/lib/view-transitions'
import { cn } from '@/lib/utils'

interface PosterTransitionProps {
    type: ContentType
    id: number
    children: ReactNode
    className?: string
    style?: CSSProperties
    alwaysActive?: boolean
}

/** Applica view-transition-name al poster in modo ottimizzato */
export function PosterTransition({
    type,
    id,
    children,
    className,
    style,
    alwaysActive = false,
}: PosterTransitionProps) {
    const reduceMotion = useReducedMotion()

    const vtStyle: CSSProperties = reduceMotion
        ? style ?? {}
        : alwaysActive
          ? {
                ...style,
                viewTransitionName: getPosterTransitionName(type, id),
            }
          : {
                ...style,
                ['--vt-poster-name' as string]: getPosterTransitionName(type, id),
            }

    return (
        <div
            className={cn(!alwaysActive && 'poster-vt-target', className)}
            style={vtStyle}
        >
            {children}
        </div>
    )
}
