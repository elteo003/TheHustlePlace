'use client'

import { useEffect } from 'react'
import {
    eventKeyCode,
    isActivateKey,
    keyToSpatialDir,
    pickSpatialTarget,
    SpatialCandidate,
    SpatialRect,
} from '@/tv/lib/spatial'

const FOCUSED_CLASS = 'is-tv-focused'

function rectOf(el: Element): SpatialRect {
    const box = el.getBoundingClientRect()
    return { x: box.left, y: box.top, w: box.width, h: box.height }
}

function isShown(el: HTMLElement) {
    if (el.hasAttribute('data-tv-disabled') || el.getAttribute('aria-disabled') === 'true') {
        return false
    }
    const rects = el.getClientRects()
    return rects.length > 0
}

function focusables(): HTMLElement[] {
    return Array.from(document.querySelectorAll<HTMLElement>('[data-tv-focus]')).filter(isShown)
}

let painted: HTMLElement | null = null

function paintFocus(el: HTMLElement | null) {
    if (painted === el) {
        if (el && el.classList.contains(FOCUSED_CLASS) === false) {
            el.classList.add(FOCUSED_CLASS)
        }
        return
    }
    if (painted) {
        painted.classList.remove(FOCUSED_CLASS)
    }
    painted = el
    if (!el) return
    el.classList.add(FOCUSED_CLASS)
    try {
        el.focus()
    } catch {
        /* webOS 4 a volte rifiuta focus() */
    }
    try {
        el.scrollIntoView(true)
    } catch {
        /* ignore */
    }
}

export function markTvFocused(el: HTMLElement) {
    paintFocus(el)
}

export function focusFirstTvNode() {
    const nodes = focusables()
    let preferred: HTMLElement | undefined
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].hasAttribute('data-tv-autofocus')) {
            preferred = nodes[i]
            break
        }
    }
    paintFocus(preferred || nodes[0] || null)
}

function currentNode(nodes: HTMLElement[]) {
    if (painted) {
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i] === painted) return painted
        }
    }
    const active = document.activeElement
    if (active instanceof HTMLElement && active.hasAttribute('data-tv-focus')) {
        return active
    }
    const marked = document.querySelector<HTMLElement>('.' + FOCUSED_CLASS)
    return marked || nodes[0] || null
}

export function useSpatialNavigation(enabled: boolean) {
    useEffect(() => {
        if (!enabled) return

        const takeFocus = () => {
            try {
                window.focus()
            } catch {
                /* ignore */
            }
            const nodes = focusables()
            const current = currentNode(nodes)
            if (current) paintFocus(current)
            else focusFirstTvNode()
        }

        const start = window.setTimeout(takeFocus, 50)
        const retry = window.setTimeout(takeFocus, 400)

        let lastStroke = ''
        const onKey = (event: KeyboardEvent) => {
            if (event.altKey || event.ctrlKey || event.metaKey) return
            const stroke = String(event.timeStamp) + ':' + eventKeyCode(event) + ':' + (event.key || '')
            if (stroke === lastStroke) return
            lastStroke = stroke

            const code = eventKeyCode(event)
            const dir = keyToSpatialDir(event.key || '', code)
            if (dir) {
                const nodes = focusables()
                const current = currentNode(nodes)
                if (!current) return
                event.preventDefault()

                const mapped: HTMLElement[] = []
                for (let i = 0; i < nodes.length; i++) {
                    if (nodes[i] !== current) mapped.push(nodes[i])
                }
                const candidates: SpatialCandidate[] = []
                for (let i = 0; i < mapped.length; i++) {
                    candidates.push({ id: String(i), rect: rectOf(mapped[i]) })
                }
                const nextId = pickSpatialTarget(rectOf(current), candidates, dir)
                if (nextId == null) {
                    paintFocus(current)
                    return
                }
                paintFocus(mapped[Number(nextId)] || current)
                return
            }

            if (isActivateKey(event.key || '', code)) {
                const nodes = focusables()
                const active = currentNode(nodes)
                if (!active) return
                event.preventDefault()
                paintFocus(active)
                active.click()
            }
        }

        document.addEventListener('keydown', onKey)
        window.addEventListener('keydown', onKey)
        return () => {
            window.clearTimeout(start)
            window.clearTimeout(retry)
            document.removeEventListener('keydown', onKey)
            window.removeEventListener('keydown', onKey)
        }
    }, [enabled])
}
