'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useScrollInputDevice } from '@/hooks/useScrollInputDevice'

interface CustomScrollbarProps {
    children: React.ReactNode
    className?: string
    /** Classi sul contenitore flex interno (es. `gap-4 items-end`) */
    containerClassName?: string
}

/**
 * Scorrimento orizzontale affidabile per scaffali streaming.
 * - Su touchpad/mobile: scorrimento fluido nativo via gesture.
 * - Su mouse con rotella: compaiono frecce eleganti ai bordi per navigare lateralmente (stile Netflix).
 */
export function CustomScrollbar({
    children,
    className = '',
    containerClassName = '',
}: CustomScrollbarProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(false)
    const { hasMouseWheel } = useScrollInputDevice()

    const updateBounds = useCallback(() => {
        const el = scrollRef.current
        if (!el) return
        const maxScroll = el.scrollWidth - el.clientWidth
        setCanScrollLeft(el.scrollLeft > 10)
        setCanScrollRight(maxScroll > 10 && el.scrollLeft < maxScroll - 10)
    }, [])

    useEffect(() => {
        const content = contentRef.current
        const scroller = scrollRef.current
        if (!content || !scroller) return

        updateBounds()

        const ro = new ResizeObserver(() => updateBounds())
        ro.observe(content)
        ro.observe(scroller)

        const mo = new MutationObserver(() => updateBounds())
        mo.observe(content, { childList: true, subtree: true, attributes: true })

        window.addEventListener('resize', updateBounds, { passive: true })

        return () => {
            ro.disconnect()
            mo.disconnect()
            window.removeEventListener('resize', updateBounds)
        }
    }, [updateBounds, children])

    const handleScroll = () => {
        updateBounds()
    }

    const scroll = (direction: 'left' | 'right') => {
        const el = scrollRef.current
        if (!el) return
        const step = Math.max(el.clientWidth * 0.75, 320)
        el.scrollBy({
            left: direction === 'left' ? -step : step,
            behavior: 'smooth',
        })
    }

    const showArrows = hasMouseWheel

    return (
        <div className={`relative group/shelf ${className}`}>
            {/* Freccia sinistra */}
            {showArrows && canScrollLeft && (
                <div
                    className="absolute left-0 top-0 bottom-4 sm:bottom-6 md:bottom-8 z-30 flex w-12 sm:w-16 md:w-20 items-center justify-start pl-1 sm:pl-2 bg-gradient-to-r from-black/90 via-black/40 to-transparent pointer-events-none opacity-0 group-hover/shelf:opacity-100 focus-within:opacity-100 transition-opacity duration-200"
                    aria-hidden={!canScrollLeft}
                >
                    <button
                        type="button"
                        onClick={() => scroll('left')}
                        className="pointer-events-auto flex h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white shadow-xl backdrop-blur-md transition-all duration-150 hover:scale-110 hover:border-white/40 hover:bg-black/90 hover:shadow-black/70 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                        aria-label="Scorri indietro"
                    >
                        <ChevronLeft className="h-6 w-6" strokeWidth={2.5} />
                    </button>
                </div>
            )}

            {/* Contenitore di scorrimento orizzontale */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="horizontal-scroll touch-pan-x overflow-x-auto overflow-y-hidden -mx-1 px-1 pb-0 scroll-smooth"
                style={{ WebkitOverflowScrolling: 'touch' }}
            >
                <div
                    ref={contentRef}
                    className={`flex w-max min-w-full ${containerClassName}`}
                >
                    {children}
                </div>
            </div>

            {/* Freccia destra */}
            {showArrows && canScrollRight && (
                <div
                    className="absolute right-0 top-0 bottom-4 sm:bottom-6 md:bottom-8 z-30 flex w-12 sm:w-16 md:w-20 items-center justify-end pr-1 sm:pr-2 bg-gradient-to-l from-black/90 via-black/40 to-transparent pointer-events-none opacity-0 group-hover/shelf:opacity-100 focus-within:opacity-100 transition-opacity duration-200"
                    aria-hidden={!canScrollRight}
                >
                    <button
                        type="button"
                        onClick={() => scroll('right')}
                        className="pointer-events-auto flex h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white shadow-xl backdrop-blur-md transition-all duration-150 hover:scale-110 hover:border-white/40 hover:bg-black/90 hover:shadow-black/70 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                        aria-label="Scorri avanti"
                    >
                        <ChevronRight className="h-6 w-6" strokeWidth={2.5} />
                    </button>
                </div>
            )}
        </div>
    )
}
