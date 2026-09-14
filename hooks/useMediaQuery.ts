'use client'

import { useEffect, useState } from 'react'

export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false)

    useEffect(() => {
        const media = window.matchMedia(query)
        setMatches(media.matches)

        const handler = (event: MediaQueryListEvent) => setMatches(event.matches)
        media.addEventListener('change', handler)
        return () => media.removeEventListener('change', handler)
    }, [query])

    return matches
}

export function resolveIsCoarsePointer(
    coarse: boolean,
    noHover: boolean,
    touchPoints = 0,
    phoneWidth = false
): boolean {
    return coarse || noHover || (touchPoints > 0 && phoneWidth)
}

function useTouchPoints(): number {
    const [points, setPoints] = useState(0)

    useEffect(() => {
        setPoints(navigator.maxTouchPoints || 0)
    }, [])

    return points
}

/** Telefono/dito. Non usare la presenza di un mouse per spegnere il dock. */
export function useIsCoarsePointer(): boolean {
    return resolveIsCoarsePointer(
        useMediaQuery('(pointer: coarse)'),
        useMediaQuery('(hover: none)'),
        useTouchPoints(),
        useMediaQuery('(max-width: 767px)')
    )
}

export function useReducedMotion(): boolean {
    return useMediaQuery('(prefers-reduced-motion: reduce)')
}

export function resolveIsPhoneLandscape(isCoarse: boolean, isShort: boolean): boolean {
    return isCoarse && isShort
}

/** Telefono girato: dito + altezza bassa. Non usare solo la larghezza. */
export function useIsPhoneLandscape(): boolean {
    return resolveIsPhoneLandscape(useIsCoarsePointer(), useMediaQuery('(max-height: 500px)'))
}
