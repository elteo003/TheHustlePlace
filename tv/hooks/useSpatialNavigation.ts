'use client'

import { useEffect } from 'react'
import { keyToSpatialDir, pickSpatialTarget, SpatialCandidate, SpatialRect } from '@/tv/lib/spatial'

function rectOf(el: Element): SpatialRect {
    const box = el.getBoundingClientRect()
    return { x: box.left, y: box.top, w: box.width, h: box.height }
}

function focusables(): HTMLElement[] {
    return Array.from(document.querySelectorAll<HTMLElement>('[data-tv-focus]')).filter(
        (el) => !el.hasAttribute('data-tv-disabled') && el.offsetParent !== null
    )
}

function focusNode(el: HTMLElement | null) {
    if (!el) return
    el.focus()
    el.scrollIntoView({ block: 'nearest', inline: 'nearest' })
}

export function focusFirstTvNode() {
    const nodes = focusables()
    const preferred = nodes.find((el) => el.hasAttribute('data-tv-autofocus')) ?? nodes[0]
    focusNode(preferred ?? null)
}

export function useSpatialNavigation(enabled: boolean) {
    useEffect(() => {
        if (!enabled) return

        const frame = window.requestAnimationFrame(() => focusFirstTvNode())

        const onKey = (event: KeyboardEvent) => {
            if (event.altKey || event.ctrlKey || event.metaKey) return

            const dir = keyToSpatialDir(event.key)
            if (dir) {
                event.preventDefault()
                const nodes = focusables()
                const current =
                    document.activeElement instanceof HTMLElement &&
                    document.activeElement.hasAttribute('data-tv-focus')
                        ? document.activeElement
                        : nodes[0]
                if (!current) return

                const candidates: SpatialCandidate[] = nodes
                    .filter((node) => node !== current)
                    .map((node, index) => ({
                        id: String(index),
                        rect: rectOf(node),
                    }))
                const mapped = nodes.filter((node) => node !== current)
                const nextId = pickSpatialTarget(rectOf(current), candidates, dir)
                if (nextId == null) return
                focusNode(mapped[Number(nextId)] ?? null)
                return
            }

            if (event.key === 'Enter') {
                const active = document.activeElement
                if (active instanceof HTMLElement && active.hasAttribute('data-tv-focus')) {
                    event.preventDefault()
                    active.click()
                }
            }
        }

        window.addEventListener('keydown', onKey)
        return () => {
            window.cancelAnimationFrame(frame)
            window.removeEventListener('keydown', onKey)
        }
    }, [enabled])
}
