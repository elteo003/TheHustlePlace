'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
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
        <div ref={containerRef} className={cn('relative inline-flex items-center', className)}>
            <motion.button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                aria-expanded={isOpen}
                aria-label={`Lingua attuale: ${currentOption.fullName}. Clicca per cambiare lingua.`}
                className={cn(
                    'group h-8 flex-shrink-0 inline-flex items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium transition-colors duration-200 select-none outline-none',
                    isOpen
                        ? 'bg-white/10 text-white'
                        : 'text-white/60 hover:bg-white/[0.08] hover:text-white'
                )}
            >
                <Globe className="h-3.5 w-3.5 text-white/50 group-hover:text-white/80 transition-colors" />
                <span className="font-semibold tracking-wide">{currentOption.label}</span>
                <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                    className="inline-flex items-center justify-center"
                >
                    <ChevronDown className="h-3 w-3 text-white/40 group-hover:text-white/70" />
                </motion.span>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="language-dropdown"
                        initial={{ opacity: 0, scale: 0.94, y: -6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: -6 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                        style={{ transformOrigin: 'top center' }}
                        className="absolute right-0 top-full z-50 mt-1.5 min-w-[140px] overflow-hidden rounded-xl border border-white/10 bg-zinc-950/95 p-1 backdrop-blur-2xl shadow-2xl shadow-black/80"
                    >
                        <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                            Lingua audio/sub
                        </div>
                        <LayoutGroup id="lang-menu-hover">
                            <div className="flex flex-col gap-0.5">
                                {options.map((opt) => {
                                    const isSelected = opt.code === language
                                    const isHovered = hovered === opt.code
                                    return (
                                        <motion.button
                                            key={opt.code}
                                            type="button"
                                            onClick={() => {
                                                setLanguage(opt.code)
                                                setIsOpen(false)
                                            }}
                                            onMouseEnter={() => setHovered(opt.code)}
                                            onMouseLeave={() => setHovered(null)}
                                            whileTap={{ scale: 0.97 }}
                                            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                                            className={cn(
                                                'relative flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[13px] font-medium outline-none transition-colors duration-150',
                                                isSelected ? 'text-white' : 'text-white/60 hover:text-white'
                                            )}
                                        >
                                            {isHovered && (
                                                <motion.span
                                                    layoutId="lang-hover-highlight"
                                                    className="absolute inset-0 rounded-lg bg-white/[0.08]"
                                                    transition={{
                                                        type: 'spring',
                                                        stiffness: 500,
                                                        damping: 35,
                                                    }}
                                                />
                                            )}
                                            <div className="relative z-10 flex items-center gap-2">
                                                <span
                                                    className={cn(
                                                        'inline-block w-7 rounded px-1 text-center font-mono text-[11px] font-bold uppercase tracking-tight',
                                                        isSelected
                                                            ? 'bg-white/20 text-white'
                                                            : 'bg-white/5 text-white/50'
                                                    )}
                                                >
                                                    {opt.label}
                                                </span>
                                                <span className="truncate">{opt.fullName}</span>
                                            </div>

                                            {isSelected && (
                                                <motion.span
                                                    initial={{ scale: 0, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    exit={{ scale: 0, opacity: 0 }}
                                                    transition={{
                                                        type: 'spring',
                                                        stiffness: 500,
                                                        damping: 30,
                                                    }}
                                                    className="relative z-10 ml-2 text-white"
                                                >
                                                    <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                                                </motion.span>
                                            )}
                                        </motion.button>
                                    )
                                })}
                            </div>
                        </LayoutGroup>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
