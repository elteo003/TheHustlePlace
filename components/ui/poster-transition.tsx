'use client'

import { CSSProperties, ReactNode } from 'react'
import { useReducedMotion } from 'framer-motion'
import { ContentType } from '@/lib/content-navigation'
import { getPosterTransitionName } from '@/lib/view-transitions'
import { cn } from '@/lib/utils'

interface PosterTransitionProps {
    type: ContentType
    id: number
    children: ReactNode
    className?: string
    style?: CSSProperties
}

/** Applica view-transition-name al poster per morph verso /movie o /series */
export function PosterTransition({ type, id, children, className, style }: PosterTransitionProps) {
    const reduceMotion = useReducedMotion()

    const vtStyle: CSSProperties = reduceMotion
        ? style ?? {}
        : {
              ...style,
              viewTransitionName: getPosterTransitionName(type, id),
          }

    return (
        <div className={cn(className)} style={vtStyle}>
            {children}
        </div>
    )
}
