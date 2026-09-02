'use client'

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useId,
    useMemo,
    useState,
    type ReactNode,
} from 'react'
import { usePathname } from 'next/navigation'

type Peek = { rowId: string; itemId: number } | null

type TrailerPeekContextValue = {
    peek: Peek
    toggle: (rowId: string, itemId: number) => void
    close: (rowId?: string) => void
}

const TrailerPeekContext = createContext<TrailerPeekContextValue | null>(null)

export function TrailerPeekProvider({ children }: { children: ReactNode }) {
    const pathname = usePathname()
    const [peek, setPeek] = useState<Peek>(null)

    useEffect(() => {
        setPeek(null)
    }, [pathname])

    const toggle = useCallback((rowId: string, itemId: number) => {
        setPeek((current) =>
            current?.rowId === rowId && current.itemId === itemId
                ? null
                : { rowId, itemId }
        )
    }, [])

    const close = useCallback((rowId?: string) => {
        setPeek((current) => {
            if (!current) {
                return null
            }
            if (rowId && current.rowId !== rowId) {
                return current
            }
            return null
        })
    }, [])

    const value = useMemo(() => ({ peek, toggle, close }), [peek, toggle, close])

    return <TrailerPeekContext.Provider value={value}>{children}</TrailerPeekContext.Provider>
}

export function useRowPeek() {
    const ctx = useContext(TrailerPeekContext)
    const rowId = useId()
    const [localPeekId, setLocalPeekId] = useState<number | null>(null)

    if (!ctx) {
        return {
            peekId: localPeekId,
            onPeek: (itemId: number) =>
                setLocalPeekId((current) => (current === itemId ? null : itemId)),
            onClose: () => setLocalPeekId(null),
        }
    }

    return {
        peekId: ctx.peek?.rowId === rowId ? ctx.peek.itemId : null,
        onPeek: (itemId: number) => ctx.toggle(rowId, itemId),
        onClose: () => ctx.close(rowId),
    }
}
