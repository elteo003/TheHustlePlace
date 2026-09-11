export type SpatialDir = 'up' | 'down' | 'left' | 'right'

export interface SpatialRect {
    x: number
    y: number
    w: number
    h: number
}

export interface SpatialCandidate<T extends string = string> {
    id: T
    rect: SpatialRect
}

function center(rect: SpatialRect) {
    return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 }
}

function overlap(a0: number, a1: number, b0: number, b1: number): number {
    return Math.max(0, Math.min(a1, b1) - Math.max(a0, b0))
}

export function pickSpatialTarget<T extends string>(
    origin: SpatialRect,
    candidates: SpatialCandidate<T>[],
    dir: SpatialDir
): T | null {
    const originCenter = center(origin)
    let best: { id: T; score: number } | null = null

    for (const candidate of candidates) {
        const next = center(candidate.rect)
        const dx = next.x - originCenter.x
        const dy = next.y - originCenter.y
        const absX = Math.abs(dx)
        const absY = Math.abs(dy)

        const horizontalOverlap = overlap(origin.x, origin.x + origin.w, candidate.rect.x, candidate.rect.x + candidate.rect.w)
        const verticalOverlap = overlap(origin.y, origin.y + origin.h, candidate.rect.y, candidate.rect.y + candidate.rect.h)

        let primary = 0
        let orthogonal = 0
        let aligned = 0

        if (dir === 'right') {
            if (dx <= 2) continue
            primary = dx
            orthogonal = absY
            aligned = verticalOverlap
        } else if (dir === 'left') {
            if (dx >= -2) continue
            primary = -dx
            orthogonal = absY
            aligned = verticalOverlap
        } else if (dir === 'down') {
            if (dy <= 2) continue
            primary = dy
            orthogonal = absX
            aligned = horizontalOverlap
        } else {
            if (dy >= -2) continue
            primary = -dy
            orthogonal = absX
            aligned = horizontalOverlap
        }

        const alignmentBonus = aligned > 8 ? 0 : 400
        const score = primary + orthogonal * 2.4 + alignmentBonus
        if (!best || score < best.score) {
            best = { id: candidate.id, score }
        }
    }

    return best?.id ?? null
}

const KEY_CODE_DIR: Record<number, SpatialDir> = {
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down',
}

export function keyToSpatialDir(key: string, keyCode?: number): SpatialDir | null {
    if (key === 'ArrowUp' || key === 'Up') return 'up'
    if (key === 'ArrowDown' || key === 'Down') return 'down'
    if (key === 'ArrowLeft' || key === 'Left') return 'left'
    if (key === 'ArrowRight' || key === 'Right') return 'right'
    if (keyCode != null && KEY_CODE_DIR[keyCode]) return KEY_CODE_DIR[keyCode]
    return null
}

export function isActivateKey(key: string, keyCode?: number): boolean {
    return key === 'Enter' || key === 'Select' || keyCode === 13
}

export const WEBOS_BACK_KEY = 'GoBack'
export const WEBOS_BACK_CODE = 461
