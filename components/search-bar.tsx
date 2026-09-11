'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

interface SearchBarProps {
    onFocusChange?: (focused: boolean) => void
}

function SearchBarInput({
    query,
    onQueryChange,
    onFocusChange,
}: {
    query: string
    onQueryChange: (value: string) => void
    onFocusChange?: (focused: boolean) => void
}) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [isFocused, setIsFocused] = useState(false)

    useEffect(() => {
        onFocusChange?.(isFocused)
    }, [isFocused, onFocusChange])

    return (
        <div className="relative w-full max-w-2xl mx-auto">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Search className="h-5 w-5 text-gray-300" />
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
                className="w-full rounded-xl border border-white/20 bg-white/10 py-3 pl-12 pr-12 text-white placeholder-gray-300 backdrop-blur-md transition-colors duration-200 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/40"
            />
            {query && (
                <button
                    type="button"
                    onClick={() => {
                        onQueryChange('')
                        inputRef.current?.focus()
                    }}
                    className="absolute inset-y-0 right-0 flex items-center pr-4"
                    aria-label="Cancella ricerca"
                >
                    <X className="h-5 w-5 text-gray-300 transition-colors hover:text-white" />
                </button>
            )}
        </div>
    )
}

function SearchBarConnected({ onFocusChange }: SearchBarProps) {
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
        />
    )
}

export function SearchBar({ onFocusChange }: SearchBarProps) {
    return (
        <Suspense
            fallback={
                <SearchBarInput query="" onQueryChange={() => undefined} onFocusChange={onFocusChange} />
            }
        >
            <SearchBarConnected onFocusChange={onFocusChange} />
        </Suspense>
    )
}
