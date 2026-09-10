'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { SearchBar } from '@/components/search-bar'
import { DeviceCodeButton } from '@/components/device-code-button'
import { useNavbarContext } from '@/contexts/NavbarContext'
import { NavIndicatorLink, NAV_LINKS } from '@/components/ui/nav-indicator-link'
import { springTransition } from '@/lib/motion'
import { NAV_VIEW_TRANSITION_NAME } from '@/lib/view-transitions'
import { cn } from '@/lib/utils'
import { useIsPhoneLandscape } from '@/hooks/useMediaQuery'

interface NavbarProps {
    immersive?: boolean
}

export function Navbar({ immersive = false }: NavbarProps) {
    const { isVisible: contextVisible } = useNavbarContext()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [searchFocused, setSearchFocused] = useState(false)
    const isPhoneLandscape = useIsPhoneLandscape()

    const shouldShow = !immersive || contextVisible || searchFocused || isMenuOpen

    return (
        <motion.nav
            aria-label="Navigazione principale"
            initial={false}
            animate={{
                y: shouldShow ? 0 : -72,
                opacity: shouldShow ? 1 : 0,
            }}
            transition={springTransition}
            style={{ viewTransitionName: NAV_VIEW_TRANSITION_NAME }}
            className={cn(
                'fixed top-0 left-0 right-0 z-50 border-b border-white/5',
                'bg-black/70 backdrop-blur-xl',
                isPhoneLandscape
                    ? 'py-2 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]'
                    : 'content-gutter py-3',
                !shouldShow && 'pointer-events-none'
            )}
        >
            <div className="flex items-center justify-between gap-4">
                <Link
                    href="/home"
                    className="flex items-center gap-2.5 group flex-shrink-0"
                    aria-label="TheHustlePlace — Home"
                >
                    <motion.div
                        className={cn(
                            'bg-white rounded-lg flex items-center justify-center',
                            isPhoneLandscape ? 'h-7 w-7' : 'h-8 w-8'
                        )}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        transition={springTransition}
                    >
                        <span className="text-black font-bold text-sm">H</span>
                    </motion.div>
                    <span
                        className={cn(
                            'text-lg font-semibold text-white tracking-tight',
                            isPhoneLandscape ? 'hidden' : 'hidden sm:block'
                        )}
                    >
                        TheHustlePlace
                    </span>
                </Link>

                <LayoutGroup id="main-nav">
                    <div className={cn('items-center gap-0.5', isPhoneLandscape ? 'hidden' : 'hidden md:flex')}>
                        {NAV_LINKS.map(({ href, label }) => (
                            <NavIndicatorLink
                                key={href}
                                href={href}
                                label={label}
                                layoutId="nav-active-pill"
                            />
                        ))}
                    </div>
                </LayoutGroup>

                <div className={cn('flex-1 max-w-sm mx-4', isPhoneLandscape ? 'hidden' : 'hidden lg:block')}>
                    <SearchBar onFocusChange={setSearchFocused} />
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                    <DeviceCodeButton />
                    <motion.button
                        type="button"
                        className={cn(
                            'p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-md',
                            !isPhoneLandscape && 'md:hidden'
                        )}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-expanded={isMenuOpen}
                        aria-label={isMenuOpen ? 'Chiudi menu' : 'Apri menu'}
                        whileTap={{ scale: 0.94 }}
                        transition={springTransition}
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.span
                                key={isMenuOpen ? 'close' : 'open'}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="block"
                            >
                                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </motion.span>
                        </AnimatePresence>
                    </motion.button>
                </div>
            </div>

            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                        className={cn(
                            'absolute top-full left-0 right-0 overflow-hidden bg-zinc-950/95 backdrop-blur-xl border-t border-white/5',
                            !isPhoneLandscape && 'md:hidden'
                        )}
                    >
                        <div className="px-4 py-4 space-y-4">
                            <SearchBar onFocusChange={setSearchFocused} />
                            <LayoutGroup id="mobile-nav">
                                <div className="space-y-0.5">
                                    {NAV_LINKS.map(({ href, label }) => (
                                        <NavIndicatorLink
                                            key={href}
                                            href={href}
                                            label={label}
                                            layoutId="nav-active-pill-mobile"
                                            className="block w-full"
                                            onClick={() => setIsMenuOpen(false)}
                                        />
                                    ))}
                                </div>
                            </LayoutGroup>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    )
}
