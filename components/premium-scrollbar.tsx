'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { readPageScrollMetrics } from '@/lib/page-scroll'

const MIN_THUMB = 48
const HIDE_MS = 1200

export function PremiumScrollbar() {
    const containerRef = useRef<HTMLDivElement>(null)
    const thumbRef = useRef<HTMLDivElement>(null)
    const metricsRef = useRef({
        clientHeight: 0,
        scrollHeight: 0,
        maxTop: 0,
        maxScroll: 0,
        height: MIN_THUMB,
        needed: false,
    })
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const dragRef = useRef<{ startY: number; startScroll: number } | null>(null)
    const rafId = useRef<number | null>(null)
    const [needed, setNeeded] = useState(false)

    // Recalculates document dimensions (only on resize, content mutation, or initial load)
    const updateMetrics = useCallback(() => {
        if (typeof window === 'undefined') return
        const { clientHeight, scrollHeight, scrollTop, canScroll } = readPageScrollMetrics(
            window,
            document
        )
        const ratio = clientHeight / Math.max(scrollHeight, 1)
        const height = Math.max(MIN_THUMB, ratio * clientHeight)
        const maxTop = Math.max(clientHeight - height, 0)
        const maxScroll = Math.max(scrollHeight - clientHeight, 1)
        const top = (scrollTop / maxScroll) * maxTop

        metricsRef.current = {
            clientHeight,
            scrollHeight,
            maxTop,
            maxScroll,
            height,
            needed: canScroll,
        }
        setNeeded((prev) => (prev !== canScroll ? canScroll : prev))

        const thumb = thumbRef.current
        if (thumb) {
            thumb.style.height = `${height}px`
            thumb.style.transform = `translate3d(0, ${top}px, 0)`
        }
    }, [])

    const show = useCallback(() => {
        if (containerRef.current) {
            containerRef.current.classList.add('is-active')
        }
        if (hideTimer.current) clearTimeout(hideTimer.current)
        hideTimer.current = setTimeout(() => {
            if (!dragRef.current && containerRef.current) {
                containerRef.current.classList.remove('is-active')
            }
        }, HIDE_MS)
    }, [])

    const scheduleThumbPosition = useCallback(() => {
        if (rafId.current !== null) return
        rafId.current = requestAnimationFrame(() => {
            rafId.current = null
            const { maxTop, maxScroll } = metricsRef.current
            if (maxTop <= 0) return
            const scrollTop = window.scrollY || document.documentElement.scrollTop || 0
            const top = (scrollTop / maxScroll) * maxTop
            const thumb = thumbRef.current
            if (thumb) {
                thumb.style.transform = `translate3d(0, ${top}px, 0)`
            }
        })
    }, [])

    useEffect(() => {
        updateMetrics()

        const onScroll = () => {
            scheduleThumbPosition()
            show()
        }

        window.addEventListener('scroll', onScroll, { passive: true })
        window.addEventListener('touchmove', onScroll, { passive: true })
        window.addEventListener('resize', updateMetrics, { passive: true })

        const ro = new ResizeObserver(updateMetrics)
        ro.observe(document.documentElement)
        if (document.body) ro.observe(document.body)

        return () => {
            window.removeEventListener('scroll', onScroll)
            window.removeEventListener('touchmove', onScroll)
            window.removeEventListener('resize', updateMetrics)
            ro.disconnect()
            if (hideTimer.current) clearTimeout(hideTimer.current)
            if (rafId.current !== null) cancelAnimationFrame(rafId.current)
        }
    }, [scheduleThumbPosition, show, updateMetrics])

    useEffect(() => {
        if (needed) updateMetrics()
    }, [needed, updateMetrics])

    useEffect(() => {
        const onMove = (event: PointerEvent) => {
            if (!dragRef.current) return
            const { maxScroll, maxTop } = metricsRef.current
            if (maxTop <= 0) return
            const delta = event.clientY - dragRef.current.startY
            const targetScroll = dragRef.current.startScroll + (delta / maxTop) * maxScroll
            window.scrollTo(0, targetScroll)
        }

        const onUp = () => {
            dragRef.current = null
            document.body.style.removeProperty('user-select')
            show()
        }

        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', onUp)
        return () => {
            window.removeEventListener('pointermove', onMove)
            window.removeEventListener('pointerup', onUp)
        }
    }, [show])

    const onThumbPointerDown = (event: React.PointerEvent) => {
        event.preventDefault()
        event.stopPropagation()
        dragRef.current = {
            startY: event.clientY,
            startScroll: window.scrollY || document.documentElement.scrollTop || 0,
        }
        document.body.style.userSelect = 'none'
        containerRef.current?.classList.add('is-active')
        if (hideTimer.current) clearTimeout(hideTimer.current)
    }

    const onTrackPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.target !== event.currentTarget) return
        const { clientHeight, scrollHeight } = metricsRef.current
        if (scrollHeight > clientHeight) {
            window.scrollTo(0, (event.clientY / clientHeight) * (scrollHeight - clientHeight))
        }
        show()
    }

    if (!needed) return null

    return (
        <div
            ref={containerRef}
            className="premium-scrollbar"
            onPointerEnter={() => containerRef.current?.classList.add('is-active')}
            onPointerLeave={() => {
                if (!dragRef.current) show()
            }}
            onPointerDown={onTrackPointerDown}
            aria-hidden
        >
            <div
                ref={thumbRef}
                className="premium-scrollbar-thumb"
                onPointerDown={onThumbPointerDown}
            />
        </div>
    )
}
