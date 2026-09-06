'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { readPageScrollMetrics } from '@/lib/page-scroll'

const MIN_THUMB = 48
const HIDE_MS = 1200

export function PremiumScrollbar() {
    const thumbRef = useRef<HTMLDivElement>(null)
    const metricsRef = useRef({ top: 0, height: MIN_THUMB, needed: false })
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const dragRef = useRef<{ startY: number; startScroll: number } | null>(null)
    const [active, setActive] = useState(false)
    const [needed, setNeeded] = useState(false)

    const updateThumb = useCallback(() => {
        const { clientHeight, scrollHeight, scrollTop, canScroll } = readPageScrollMetrics(
            window,
            document
        )
        const ratio = clientHeight / Math.max(scrollHeight, 1)
        const height = Math.max(MIN_THUMB, ratio * clientHeight)
        const maxTop = Math.max(clientHeight - height, 0)
        const maxScroll = Math.max(scrollHeight - clientHeight, 1)
        const top = (scrollTop / maxScroll) * maxTop

        metricsRef.current = { top, height, needed: canScroll }
        setNeeded(canScroll)

        const thumb = thumbRef.current
        if (thumb) {
            thumb.style.height = `${height}px`
            thumb.style.transform = `translateY(${top}px)`
        }
    }, [])

    const show = useCallback(() => {
        setActive(true)
        if (hideTimer.current) clearTimeout(hideTimer.current)
        hideTimer.current = setTimeout(() => {
            if (!dragRef.current) setActive(false)
        }, HIDE_MS)
    }, [])

    useEffect(() => {
        updateThumb()

        const onScroll = () => {
            updateThumb()
            show()
        }

        window.addEventListener('scroll', onScroll, { passive: true, capture: true })
        document.addEventListener('scroll', onScroll, { passive: true, capture: true })
        window.addEventListener('touchmove', onScroll, { passive: true })
        window.addEventListener('resize', updateThumb)

        const ro = new ResizeObserver(updateThumb)
        ro.observe(document.documentElement)
        if (document.body) ro.observe(document.body)

        return () => {
            window.removeEventListener('scroll', onScroll, true)
            document.removeEventListener('scroll', onScroll, true)
            window.removeEventListener('touchmove', onScroll)
            window.removeEventListener('resize', updateThumb)
            ro.disconnect()
            if (hideTimer.current) clearTimeout(hideTimer.current)
        }
    }, [show, updateThumb])

    useEffect(() => {
        if (needed) updateThumb()
    }, [needed, updateThumb])

    useEffect(() => {
        const onMove = (event: PointerEvent) => {
            if (!dragRef.current) return
            const { clientHeight, scrollHeight } = readPageScrollMetrics(window, document)
            const maxScroll = scrollHeight - clientHeight
            const maxTop = clientHeight - metricsRef.current.height
            if (maxTop <= 0) return
            const delta = event.clientY - dragRef.current.startY
            window.scrollTo(0, dragRef.current.startScroll + (delta / maxTop) * maxScroll)
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
            startScroll: readPageScrollMetrics(window, document).scrollTop,
        }
        document.body.style.userSelect = 'none'
        setActive(true)
        if (hideTimer.current) clearTimeout(hideTimer.current)
    }

    const onTrackPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.target !== event.currentTarget) return
        const { clientHeight, scrollHeight } = readPageScrollMetrics(window, document)
        window.scrollTo(0, (event.clientY / clientHeight) * (scrollHeight - clientHeight))
        show()
    }

    if (!needed) return null

    return (
        <div
            className={`premium-scrollbar${active ? ' is-active' : ''}`}
            onPointerEnter={() => setActive(true)}
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
