'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CustomScrollbarProps {
    children: React.ReactNode
    className?: string
    /** Classi sul contenitore flex interno (es. `gap-4 items-end`) */
    containerClassName?: string
    /**
     * Se true (default), estende lo scaffale a filo schermo (-mx dei gutter)
     * e applica il padding interno (px) in modo che le card allineino con i titoli
     * e scorrano fino al bordo destro dello schermo senza gap o tagli bruschi.
     */
    bleed?: boolean
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
    bleed = true,
}: CustomScrollbarProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const rafId = useRef<number | null>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(false)

    const updateBounds = useCallback(() => {
        if (rafId.current !== null) return
        rafId.current = requestAnimationFrame(() => {
            rafId.current = null
            const el = scrollRef.current
            if (!el) return
            const maxScroll = el.scrollWidth - el.clientWidth
            const left = el.scrollLeft > 10
            const right = maxScroll > 10 && el.scrollLeft < maxScroll - 10
            setCanScrollLeft((prev) => (prev !== left ? left : prev))
            setCanScrollRight((prev) => (prev !== right ? right : prev))
        })
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
        mo.observe(content, { childList: true })

        window.addEventListener('resize', updateBounds, { passive: true })

        return () => {
            if (rafId.current !== null) cancelAnimationFrame(rafId.current)
            ro.disconnect()
            mo.disconnect()
            window.removeEventListener('resize', updateBounds)
        }
    }, [updateBounds])

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

    return (
        <div
            className={`relative group/shelf ${
                bleed ? '-mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-10' : ''
            } ${className}`}
        >
            {/* Freccia sinistra con sfumatura precisa e profonda */}
            {canScrollLeft && (
                <div
                    className="hidden md:flex absolute left-0 inset-y-0 z-30 w-16 sm:w-24 md:w-32 lg:w-40 items-center justify-start pl-2 sm:pl-3 md:pl-4 pointer-events-none opacity-0 group-hover/shelf:opacity-100 focus-within:opacity-100 transition-opacity duration-200"
                    style={{
                        background:
                            'linear-gradient(to right, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 20%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.2) 75%, transparent 100%)',
                    }}
                    aria-hidden={!canScrollLeft}
                >
                    <button
                        type="button"
                        onClick={() => scroll('left')}
                        className="pointer-events-auto flex h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 items-center justify-center rounded-full border border-white/25 bg-zinc-900/90 text-white shadow-[0_4px_20px_rgba(0,0,0,0.6)] transition-[transform,background-color,border-color,box-shadow] duration-180 hover:scale-110 hover:border-white/50 hover:bg-zinc-800/95 hover:shadow-[0_6px_28px_rgba(0,0,0,0.85)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                        aria-label="Scorri indietro"
                    >
                        <ChevronLeft className="h-6 w-6" strokeWidth={2.5} />
                    </button>
                </div>
            )}

            {/* Contenitore di scorrimento orizzontale a tutta larghezza */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="horizontal-scroll overflow-x-auto overflow-y-hidden scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                style={{ WebkitOverflowScrolling: 'touch' }}
            >
                <div
                    ref={contentRef}
                    className={`flex w-max min-w-full ${
                        bleed ? 'px-4 sm:px-6 lg:px-8 xl:px-10' : ''
                    } ${containerClassName}`}
                >
                    {children}
                </div>
            </div>

            {/* Freccia destra con sfumatura precisa e profonda */}
            {canScrollRight && (
                <div
                    className="hidden md:flex absolute right-0 inset-y-0 z-30 w-16 sm:w-24 md:w-32 lg:w-40 items-center justify-end pr-2 sm:pr-3 md:pr-4 pointer-events-none opacity-0 group-hover/shelf:opacity-100 focus-within:opacity-100 transition-opacity duration-200"
                    style={{
                        background:
                            'linear-gradient(to left, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 20%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.2) 75%, transparent 100%)',
                    }}
                    aria-hidden={!canScrollRight}
                >
                    <button
                        type="button"
                        onClick={() => scroll('right')}
                        className="pointer-events-auto flex h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 items-center justify-center rounded-full border border-white/25 bg-zinc-900/90 text-white shadow-[0_4px_20px_rgba(0,0,0,0.6)] transition-[transform,background-color,border-color,box-shadow] duration-180 hover:scale-110 hover:border-white/50 hover:bg-zinc-800/95 hover:shadow-[0_6px_28px_rgba(0,0,0,0.85)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                        aria-label="Scorri avanti"
                    >
                        <ChevronRight className="h-6 w-6" strokeWidth={2.5} />
                    </button>
                </div>
            )}
        </div>
    )
}
