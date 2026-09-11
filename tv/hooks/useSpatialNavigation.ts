'use client'

import { useEffect } from 'react'
import {
    isActivateKey,
    keyToSpatialDir,
    pickSpatialTarget,
    SpatialCandidate,
    SpatialRect,
} from '@/tv/lib/spatial'

function rectOf(el: Element): SpatialRect {
    const box = el.getBoundingClientRect()
    return { x: box.left, y: box.top, w: box.width, h: box.height }
}

function isShown(el: HTMLElement) {
    return !el.hasAttribute('data-tv-disabled') && el.getClientRects().length > 0
}

function focusables(): HTMLElement[] {
    return Array.from(document.querySelectorAll<HTMLElement>('[data-tv-focus]')).filter(isShown)
}

function focusedTvNode(): HTMLElement | null {
    const active = document.activeElement
    if (active instanceof HTMLElement && active.hasAttribute('data-tv-focus') && isShown(active)) {
        return active
    }
    return null
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

        const takeFocus = () => {
            window.focus()
            if (!focusedTvNode()) focusFirstTvNode()
        }

        const frame = window.requestAnimationFrame(takeFocus)

        const observer = new MutationObserver(() => {
            if (!focusedTvNode()) focusFirstTvNode()
        })
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['hidden', 'data-tv-focus', 'data-tv-disabled'],
        })

        const onKey = (event: KeyboardEvent) => {
            if (event.altKey || event.ctrlKey || event.metaKey) return

            const dir = keyToSpatialDir(event.key, event.keyCode)
            if (dir) {
                event.preventDefault()
                event.stopPropagation()
                const nodes = focusables()
                const current = focusedTvNode() ?? nodes[0]
                if (!current) return

                const mapped = nodes.filter((node) => node !== current)
                const candidates: SpatialCandidate[] = mapped.map((node, index) => ({
                    id: String(index),
                    rect: rectOf(node),
                }))
                const nextId = pickSpatialTarget(rectOf(current), candidates, dir)
                if (nextId == null) {
                    focusNode(current)
                    return
                }
                focusNode(mapped[Number(nextId)] ?? null)
                return
            }

            if (isActivateKey(event.key, event.keyCode)) {
                const active = focusedTvNode() ?? focusables()[0]
                if (!active) return
                event.preventDefault()
                event.stopPropagation()
                if (document.activeElement !== active) focusNode(active)
                active.click()
            }
        }

        window.addEventListener('keydown', onKey, true)
        return () => {
            window.cancelAnimationFrame(frame)
            observer.disconnect()
            window.removeEventListener('keydown', onKey, true)
        }
    }, [enabled])
}
