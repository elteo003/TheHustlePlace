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

export function resolveIsCoarsePointer(coarse: boolean, noHover: boolean): boolean {
    return coarse || noHover
}

/** Telefono/dito. Non usare la presenza di un mouse per spegnere il dock. */
export function useIsCoarsePointer(): boolean {
    return resolveIsCoarsePointer(
        useMediaQuery('(pointer: coarse)'),
        useMediaQuery('(hover: none)')
    )
}

export function useReducedMotion(): boolean {
    return useMediaQuery('(prefers-reduced-motion: reduce)')
}
