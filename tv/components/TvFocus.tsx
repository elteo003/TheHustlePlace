'use client'

import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface TvFocusProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    autoFocusItem?: boolean
}

export const TvFocus = forwardRef<HTMLButtonElement, TvFocusProps>(function TvFocus(
    { autoFocusItem, className, type = 'button', ...props },
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
            {...props}
        />
    )
})
