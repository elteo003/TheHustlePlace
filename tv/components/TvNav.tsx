'use client'

import { usePathname, useRouter } from 'next/navigation'
import { LIVING_ROOT, livingHomePath, livingMoviesPath, livingSearchPath, livingSeriesPath } from '@/tv/lib/paths'
import { avatarColor, avatarInitial } from '@/tv/lib/avatars'
import { useHousehold } from '@/tv/hooks/useHousehold'
import { TvFocus } from '@/tv/components/TvFocus'
import { cn } from '@/lib/utils'

const LINKS = [
    { href: livingHomePath(), label: 'Home', match: '/living/home' },
    { href: livingMoviesPath(), label: 'Film', match: '/living/movies' },
    { href: livingSeriesPath(), label: 'Serie', match: '/living/series' },
    { href: livingSearchPath(), label: 'Cerca', match: '/living/search' },
]

export function TvNav() {
    const pathname = usePathname()
    const router = useRouter()
    const { activeProfile } = useHousehold()

    return (
        <header className="flex items-center justify-between gap-6">
            <nav className="flex items-center gap-2">
                {LINKS.map((link, index) => {
                    const active = pathname === link.match
                    return (
                        <TvFocus
                            key={link.href}
                            autoFocusItem={index === 0 && pathname !== '/living/home'}
                            onClick={() => router.push(link.href)}
                            className={cn(
                                'rounded-lg px-5 py-3 text-xl',
                                active ? 'bg-white text-black' : 'text-white/70'
                            )}
                        >
                            {link.label}
                        </TvFocus>
                    )
                })}
            </nav>
            <TvFocus
                onClick={() => router.push(LIVING_ROOT)}
                className="flex items-center gap-3 rounded-full py-2 pl-2 pr-4"
            >
                <span
                    className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold text-white"
                    style={{ background: avatarColor(activeProfile?.avatar ?? 0) }}
                >
                    {avatarInitial(activeProfile?.name ?? 'P')}
                </span>
                <span className="text-xl text-white">{activeProfile?.name ?? 'Profilo'}</span>
            </TvFocus>
        </header>
    )
}
