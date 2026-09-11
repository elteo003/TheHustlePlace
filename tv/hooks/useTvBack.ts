'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { LIVING_ROOT, livingDetailsPath, livingHomePath } from '@/tv/lib/paths'
import { WEBOS_BACK_CODE as BackCode, WEBOS_BACK_KEY as BackKey } from '@/tv/lib/spatial'

function leaveTvApp() {
    const webos = (window as Window & { webOS?: { platformBack?: () => void } }).webOS
    if (webos?.platformBack) {
        webos.platformBack()
        return
    }
    window.close()
}

export function useTvBack() {
    const pathname = usePathname()
    const router = useRouter()

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            const isBack = event.key === 'Escape' || event.key === BackKey || event.keyCode === BackCode
            if (!isBack) return
            event.preventDefault()

            if (pathname === LIVING_ROOT) {
                leaveTvApp()
                return
            }

            const playerMovie = pathname.match(/^\/living\/player\/movie\/(\d+)/)
            if (playerMovie) {
                router.push(livingDetailsPath(Number(playerMovie[1]), 'movie'))
                return
            }
            const playerTv = pathname.match(/^\/living\/player\/tv\/(\d+)/)
            if (playerTv) {
                router.push(livingDetailsPath(Number(playerTv[1]), 'tv'))
                return
            }
            if (pathname.startsWith('/living/movie/') || pathname.startsWith('/living/series/')) {
                router.push(livingHomePath())
                return
            }
            if (pathname !== LIVING_ROOT) {
                router.push(LIVING_ROOT)
            }
        }

        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [pathname, router])
}
