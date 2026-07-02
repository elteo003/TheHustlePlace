'use client'

import { useEffect, useRef, useCallback } from 'react'

interface CustomScrollbarProps {
    children: React.ReactNode
    className?: string
    /** Classi sul contenitore flex interno (es. `gap-4 items-end`) */
    containerClassName?: string
}

/**
 * Scorrimento orizzontale affidabile.
 * Usa overflow nativo + scrollbar stilizzata (niente thumb custom che si desincronizza
 * quando le card si espandono o le immagini caricano).
 */
export function CustomScrollbar({
    children,
    className = '',
    containerClassName = '',
}: CustomScrollbarProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)

    const refresh = useCallback(() => {
        const el = scrollRef.current
        if (!el) return
        // Forza il browser a ricalcolare le dimensioni di scroll
        void el.scrollWidth
    }, [])

    useEffect(() => {
        const content = contentRef.current
        const scroller = scrollRef.current
        if (!content || !scroller) return

        refresh()

        const ro = new ResizeObserver(() => refresh())
        ro.observe(content)

        const mo = new MutationObserver(() => refresh())
        mo.observe(content, { childList: true, subtree: true, attributes: true })

        window.addEventListener('resize', refresh, { passive: true })

        return () => {
            ro.disconnect()
            mo.disconnect()
            window.removeEventListener('resize', refresh)
        }
    }, [refresh, children])

    return (
        <div className={className}>
            <div
                ref={scrollRef}
                className="horizontal-scroll overflow-x-auto overflow-y-hidden -mx-1 px-1 pb-1"
                style={{ WebkitOverflowScrolling: 'touch' }}
            >
                <div
                    ref={contentRef}
                    className={`flex w-max min-w-full ${containerClassName}`}
                >
                    {children}
                </div>
            </div>
        </div>
    )
}
