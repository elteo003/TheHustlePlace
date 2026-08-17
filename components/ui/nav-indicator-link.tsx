'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { springTransition } from '@/lib/motion'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
    { href: '/home', label: 'Home' },
    { href: '/movies', label: 'Film' },
    { href: '/tv', label: 'Serie TV' },
    { href: '/catalog', label: 'Catalogo' },
] as const

export function isNavLinkActive(pathname: string | null, href: string): boolean {
    if (!pathname) return false
    if (href === '/home') return pathname === '/home'
    if (href === '/movies') return pathname === '/movies' || pathname.startsWith('/movie/')
    if (href === '/tv') return pathname === '/tv' || pathname.startsWith('/series/')
    return pathname === href || pathname.startsWith(`${href}/`)
}

interface NavIndicatorLinkProps {
    href: string
    label: string
    layoutId: string
    className?: string
    onClick?: () => void
}

export function NavIndicatorLink({
    href,
    label,
    layoutId,
    className,
    onClick,
}: NavIndicatorLinkProps) {
    const pathname = usePathname()
    const active = isNavLinkActive(pathname, href)

    return (
        <Link
            href={href}
            prefetch
            onClick={onClick}
            className={cn(
                'relative px-3 py-1.5 rounded-md text-sm font-medium outline-none',
                'transition-colors duration-200',
                active ? 'text-white' : 'text-white/55 hover:text-white/90',
                className
            )}
            aria-current={active ? 'page' : undefined}
        >
            {active && (
                <motion.span
                    layoutId={layoutId}
                    className="absolute inset-0 rounded-md bg-white/[0.12] ring-1 ring-white/10"
                    transition={springTransition}
                    aria-hidden
                />
            )}
            <span className="relative z-10">{label}</span>
        </Link>
    )
}

export { NAV_LINKS }
