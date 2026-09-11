'use client'

import { useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { isLivingPath, isWebosUserAgent, LIVING_ROOT } from '@/tv/lib/paths'

export function TvEntryRedirect() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const router = useRouter()

    useEffect(() => {
        if (isLivingPath(pathname)) return
        const forced = searchParams.get('tv') === '1'
        const webos = typeof navigator !== 'undefined' && isWebosUserAgent(navigator.userAgent)
        if (forced || webos) {
            router.replace(LIVING_ROOT)
        }
    }, [pathname, router, searchParams])

    return null
}
