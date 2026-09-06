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
    closingId: number | null
    toggle: (rowId: string, itemId: number) => void
    close: (rowId?: string) => void
    clearClosing: () => void
}

const TrailerPeekContext = createContext<TrailerPeekContextValue | null>(null)

export function TrailerPeekProvider({ children }: { children: ReactNode }) {
    const pathname = usePathname()
    const [peek, setPeek] = useState<Peek>(null)
    const [closingId, setClosingId] = useState<number | null>(null)

    useEffect(() => {
        setPeek(null)
        setClosingId(null)
    }, [pathname])

    const toggle = useCallback((rowId: string, itemId: number) => {
        setPeek((current) => {
            if (current?.rowId === rowId && current.itemId === itemId) {
                setClosingId(itemId)
                return null
            }
            if (current) {
                setClosingId(current.itemId)
            }
            return { rowId, itemId }
        })
    }, [])

    const close = useCallback((rowId?: string) => {
        setPeek((current) => {
            if (!current) {
                return null
            }
            if (rowId && current.rowId !== rowId) {
                return current
            }
            setClosingId(current.itemId)
            return null
        })
    }, [])

    const clearClosing = useCallback(() => setClosingId(null), [])

    const value = useMemo(
        () => ({ peek, closingId, toggle, close, clearClosing }),
        [peek, closingId, toggle, close, clearClosing]
    )

    return <TrailerPeekContext.Provider value={value}>{children}</TrailerPeekContext.Provider>
}

export function useRowPeek() {
    const ctx = useContext(TrailerPeekContext)
    const rowId = useId()
    const [localPeekId, setLocalPeekId] = useState<number | null>(null)

    if (!ctx) {
        return {
            peekId: localPeekId,
            isPosterHidden: (itemId: number) => localPeekId === itemId,
            onPeek: (itemId: number) =>
                setLocalPeekId((current) => (current === itemId ? null : itemId)),
            onClose: () => setLocalPeekId(null),
            onExited: () => undefined,
        }
    }

    return {
        peekId: ctx.peek?.rowId === rowId ? ctx.peek.itemId : null,
        isPosterHidden: (itemId: number) =>
            ctx.peek?.itemId === itemId || ctx.closingId === itemId,
        onPeek: (itemId: number) => ctx.toggle(rowId, itemId),
        onClose: () => ctx.close(rowId),
        onExited: ctx.clearClosing,
    }
}
