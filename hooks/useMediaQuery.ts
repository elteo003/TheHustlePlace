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

export function useIsCoarsePointer(): boolean {
    const coarse = useMediaQuery('(pointer: coarse)')
    const noHover = useMediaQuery('(hover: none)')
    return coarse || noHover
}

export function useReducedMotion(): boolean {
    return useMediaQuery('(prefers-reduced-motion: reduce)')
}
