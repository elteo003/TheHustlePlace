'use client'

import { useEffect, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { HouseholdProvider } from '@/tv/hooks/useHousehold'
import { focusFirstTvNode, useSpatialNavigation } from '@/tv/hooks/useSpatialNavigation'
import { useTvBack } from '@/tv/hooks/useTvBack'
import { isLivingPlayerPath } from '@/tv/lib/paths'

export function TvApp({ children }: { children: ReactNode }) {
    const pathname = usePathname()
    const onPlayer = isLivingPlayerPath(pathname)
    useSpatialNavigation(!onPlayer)
    useTvBack()

    useEffect(() => {
        document.documentElement.classList.add('tv-app')
        document.body.classList.add('tv-app')
        return () => {
            document.documentElement.classList.remove('tv-app')
            document.body.classList.remove('tv-app')
        }
    }, [])

    useEffect(() => {
        if (onPlayer) return
        const frame = window.requestAnimationFrame(() => focusFirstTvNode())
        return () => window.cancelAnimationFrame(frame)
    }, [onPlayer, pathname])

    return (
        <HouseholdProvider>
            <div
                className={
                    pathname.includes('/player/')
                        ? 'min-h-screen bg-black text-white'
                        : 'tv-shell min-h-screen bg-black px-[80px] py-10 text-white'
                }
            >
                {children}
            </div>
        </HouseholdProvider>
    )
}
