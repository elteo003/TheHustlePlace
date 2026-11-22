'use client'

import { Suspense, useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { Search, X } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'

export interface SearchBarProps {
    onFocusChange?: (focused: boolean) => void
    variant?: 'inline' | 'drawer'
    className?: string
}

function SearchBarInput({
    query,
    onQueryChange,
    onFocusChange,
    variant = 'inline',
    className,
}: {
    query: string
    onQueryChange: (value: string) => void
    onFocusChange?: (focused: boolean) => void
    variant?: 'inline' | 'drawer'
    className?: string
}) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [isFocused, setIsFocused] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const pathname = usePathname()
    const shouldReduceMotion = useReducedMotion()

    useEffect(() => {
        onFocusChange?.(isFocused)
    }, [isFocused, onFocusChange])

    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current)
            }
        }
    }, [])

    const handleMouseEnter = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current)
            hoverTimeoutRef.current = null
        }
        setIsHovered(true)
    }

    const handleMouseLeave = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current)
        }
        hoverTimeoutRef.current = setTimeout(() => {
            setIsHovered(false)
        }, 150)
    }

    const hasQuery = Boolean(query && query.trim())
    const onSearchPage = pathname === '/search'
    const isExpanded = variant === 'drawer' || isHovered || isFocused || hasQuery || (onSearchPage && hasQuery)

    const handleExpandClick = () => {
        if (!isExpanded) {
            setIsHovered(true)
        }
        inputRef.current?.focus()
    }

    if (variant === 'drawer') {
        return (
            <div className={cn('relative w-full', className)}>
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Search className="h-4 w-4 text-white/40" />
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(event) => onQueryChange(event.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Cerca film e serie TV..."
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    className="w-full h-10 rounded-xl border border-white/15 bg-white/[0.06] pl-10 pr-10 text-sm text-white placeholder-white/40 backdrop-blur-md transition-colors duration-200 focus:border-white/30 focus:bg-white/[0.1] focus:outline-none focus:ring-1 focus:ring-white/20"
                />
                {query && (
                    <button
                        type="button"
                        onClick={() => {
                            onQueryChange('')
                            inputRef.current?.focus()
                        }}
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                        aria-label="Cancella ricerca"
                    >
                        <X className="h-4 w-4 text-white/40 transition-colors hover:text-white" />
                    </button>
                )}
            </div>
        )
    }

    return (
        <motion.div
            initial={false}
            animate={{
                width: isExpanded ? 260 : 36,
            }}
            transition={{
                duration: shouldReduceMotion ? 0 : 0.28,
                ease: [0.16, 1, 0.3, 1],
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={cn(
                'relative flex items-center h-9 flex-shrink-0 overflow-hidden select-none transition-colors duration-200',
                isExpanded
                    ? 'rounded-lg bg-white/10 border border-white/15 backdrop-blur-md shadow-sm ring-1 ring-white/5 focus-within:border-white/30 focus-within:bg-white/[0.12] focus-within:ring-white/20'
                    : 'rounded-md bg-transparent hover:bg-white/[0.08] text-white/60 hover:text-white border border-transparent',
                className
            )}
        >
            <button
                type="button"
                onClick={handleExpandClick}
                className={cn(
                    'flex items-center justify-center flex-shrink-0 transition-colors duration-200',
                    isExpanded
                        ? 'absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/50'
                        : 'w-full h-full text-white/60 hover:text-white cursor-pointer'
                )}
                aria-label={isExpanded ? undefined : 'Cerca film e serie TV'}
                tabIndex={isExpanded ? -1 : 0}
            >
                <Search className="h-4 w-4" />
            </button>

            <motion.input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(event: ChangeEvent<HTMLInputElement>) => onQueryChange(event.target.value)}
                onFocus={() => {
                    setIsFocused(true)
                    setIsHovered(true)
                }}
                onBlur={() => setIsFocused(false)}
                onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                    if (event.key === 'Escape') {
                        inputRef.current?.blur()
                        if (!query.trim()) {
                            setIsHovered(false)
                        }
                    }
                }}
                tabIndex={isExpanded ? 0 : -1}
                placeholder="Cerca film e serie TV..."
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                initial={false}
                animate={{
                    opacity: isExpanded ? 1 : 0,
                }}
                transition={{
                    duration: shouldReduceMotion ? 0 : 0.18,
                    delay: isExpanded ? 0.06 : 0,
                }}
                className={cn(
                    'h-full w-full bg-transparent pl-[34px] pr-8 text-sm text-white placeholder-white/40 focus:outline-none whitespace-nowrap',
                    !isExpanded && 'pointer-events-none'
                )}
                aria-label="Cerca film e serie TV"
            />

            {isExpanded && query && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation()
                        onQueryChange('')
                        inputRef.current?.focus()
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center p-0.5 rounded text-white/40 hover:text-white transition-colors"
                    aria-label="Cancella ricerca"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            )}
        </motion.div>
    )
}

function SearchBarConnected({ onFocusChange, variant, className }: SearchBarProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const urlQuery = searchParams.get('q') ?? ''
    const [query, setQuery] = useState(urlQuery)
    const focusedRef = useRef(false)

    useEffect(() => {
        if (!focusedRef.current && urlQuery !== query) {
            setQuery(urlQuery)
        }
    }, [query, urlQuery])

    const pushQuery = (value: string) => {
        setQuery(value)
        const trimmed = value.trim()
        if (trimmed) {
            router.replace(`/search?q=${encodeURIComponent(value)}`, { scroll: false })
            return
        }
        if (pathname === '/search') {
            router.replace('/home', { scroll: false })
        }
    }

    return (
        <SearchBarInput
            query={query}
            onQueryChange={pushQuery}
            onFocusChange={(focused) => {
                focusedRef.current = focused
                onFocusChange?.(focused)
            }}
            variant={variant}
            className={className}
        />
    )
}

export function SearchBar({ onFocusChange, variant = 'inline', className }: SearchBarProps) {
    return (
        <Suspense
            fallback={
                <SearchBarInput
                    query=""
                    onQueryChange={() => undefined}
                    onFocusChange={onFocusChange}
                    variant={variant}
                    className={className}
                />
            }
        >
            <SearchBarConnected
                onFocusChange={onFocusChange}
                variant={variant}
                className={className}
            />
        </Suspense>
    )
}
