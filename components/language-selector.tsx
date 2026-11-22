'use client'

import { useEffect, useRef, useState, startTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useMediaQuery'
import { Check, ChevronDown, Globe } from 'lucide-react'
import { LanguageCode, useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

interface LanguageSelectorProps {
    className?: string
    variant?: 'navbar' | 'compact' | 'drawer'
}

export function LanguageSelector({ className, variant = 'navbar' }: LanguageSelectorProps) {
    const { language, setLanguage, currentOption, options } = useLanguage()
    const [isOpen, setIsOpen] = useState(false)
    const [hovered, setHovered] = useState<LanguageCode | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const shouldReduceMotion = useReducedMotion()

    useEffect(() => {
        if (!isOpen) return

        const handlePointerDown = (event: MouseEvent | TouchEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false)
            }
        }

        document.addEventListener('pointerdown', handlePointerDown)
        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('pointerdown', handlePointerDown)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [isOpen])

    if (variant === 'drawer') {
        return (
            <div className={cn('space-y-1.5', className)}>
                <div className="flex items-center gap-2 px-2 text-[11px] font-medium uppercase tracking-wider text-white/40">
                    <Globe className="h-3.5 w-3.5 text-white/50" />
                    <span>Lingua preferita</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-white/[0.04] p-1 border border-white/5">
                    {options.map((opt) => {
                        const isSelected = opt.code === language
                        return (
                            <button
                                key={opt.code}
                                type="button"
                                onClick={() => setLanguage(opt.code)}
                                className={cn(
                                    'relative flex h-8 items-center justify-center rounded-lg text-[13px] font-medium transition-colors duration-150',
                                    isSelected
                                        ? 'text-white font-semibold'
                                        : 'text-white/50 hover:text-white/80'
                                )}
                            >
                                {isSelected && (
                                    <motion.div
                                        layoutId="drawer-lang-active"
                                        className="absolute inset-0 rounded-lg bg-white/15 border border-white/10 shadow-sm"
                                        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                                    />
                                )}
                                <span className="relative z-10">{opt.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>
        )
    }

    return (
        <div ref={containerRef} className={cn('relative inline-flex items-center flex-shrink-0', className)}>
            <motion.button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                aria-expanded={isOpen}
                aria-label={`Lingua attuale: ${currentOption.fullName}. Clicca per cambiare lingua.`}
                className={cn(
                    'group h-9 w-[78px] flex-shrink-0 inline-flex items-center justify-center gap-1 rounded-md px-2 text-[13px] font-medium transition-colors duration-200 select-none outline-none',
                    isOpen
                        ? 'bg-white/10 text-white'
                        : 'text-white/60 hover:bg-white/[0.08] hover:text-white'
                )}
            >
                <Globe className="h-3.5 w-3.5 flex-shrink-0 text-white/50 group-hover:text-white/80 transition-colors" />
                <span className="w-7 flex-shrink-0 text-center font-semibold tracking-wide">{currentOption.label}</span>
                <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    className="inline-flex items-center justify-center flex-shrink-0"
                >
                    <ChevronDown className="h-3 w-3 text-white/40 group-hover:text-white/70" />
                </motion.span>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="language-dropdown"
                        initial={{
                            opacity: 0,
                            scale: shouldReduceMotion ? 1 : 0.96,
                            y: shouldReduceMotion ? 0 : -4,
                        }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                            transition: shouldReduceMotion
                                ? { duration: 0.15 }
                                : { duration: 0.16, ease: [0.16, 1, 0.3, 1] },
                        }}
                        exit={{
                            opacity: 0,
                            scale: shouldReduceMotion ? 1 : 0.97,
                            y: shouldReduceMotion ? 0 : -3,
                            transition: { duration: 0.12, ease: [0.23, 1, 0.32, 1] },
                        }}
                        style={{ transformOrigin: 'top right', willChange: 'transform, opacity' }}
                        className="absolute right-0 top-full z-50 mt-1.5 w-36 rounded-xl border border-white/10 bg-zinc-950/92 p-1 backdrop-blur-md shadow-xl shadow-black/60"
                    >
                        <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                            Lingua audio
                        </div>
                        <div className="flex flex-col gap-0.5">
                            {options.map((opt) => {
                                const isSelected = opt.code === language
                                const isHovered = hovered === opt.code
                                return (
                                    <motion.button
                                        key={opt.code}
                                        type="button"
                                        onClick={() => {
                                            setIsOpen(false)
                                            startTransition(() => {
                                                setLanguage(opt.code)
                                            })
                                        }}
                                        onMouseEnter={() => setHovered(opt.code)}
                                        onMouseLeave={() => setHovered(null)}
                                        whileTap={{ scale: 0.97 }}
                                        transition={{ duration: 0.1 }}
                                        className={cn(
                                            'relative flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[13px] font-medium outline-none transition-colors duration-150',
                                            isSelected ? 'text-white' : 'text-white/60 hover:text-white'
                                        )}
                                    >
                                        {isHovered && (
                                            <motion.span
                                                layoutId="lang-hover-highlight"
                                                className="absolute inset-0 rounded-lg bg-white/[0.08]"
                                                initial={false}
                                                transition={{
                                                    type: 'spring',
                                                    stiffness: 550,
                                                    damping: 35,
                                                    mass: 0.5,
                                                }}
                                            />
                                        )}
                                        <span className="relative z-10 truncate text-[13px]">{opt.fullName}</span>

                                        {isSelected && (
                                            <motion.span
                                                initial={false}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="relative z-10 ml-2 text-white"
                                            >
                                                <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                                            </motion.span>
                                        )}
                                    </motion.button>
                                )
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
