'use client'

import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'
import { markTvFocused } from '@/tv/hooks/useSpatialNavigation'

interface TvFocusProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    autoFocusItem?: boolean
}

export const TvFocus = forwardRef<HTMLButtonElement, TvFocusProps>(function TvFocus(
    { autoFocusItem, className, type = 'button', onFocus, ...props },
    ref
) {
    return (
        <button
            ref={ref}
            type={type}
            tabIndex={0}
            data-tv-focus=""
            data-tv-autofocus={autoFocusItem ? '' : undefined}
            data-tv-disabled={props.disabled ? '' : undefined}
            className={cn('tv-focusable', className)}
            onFocus={(event) => {
                markTvFocused(event.currentTarget)
                if (onFocus) onFocus(event)
            }}
            {...props}
        />
    )
})
