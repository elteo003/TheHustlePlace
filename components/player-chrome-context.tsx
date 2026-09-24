'use client'

import { createContext, useContext } from 'react'

export type PlayerChromeValue = {
    onBack: () => void
    onNext?: () => void
    nextLabel?: string
    title?: string
    pinNext: boolean
    chromePaused: boolean
}

const PlayerChromeContext = createContext<PlayerChromeValue | null>(null)

export function PlayerChromeProvider({
    value,
    children,
}: {
    value: PlayerChromeValue
    children: React.ReactNode
}) {
    return <PlayerChromeContext.Provider value={value}>{children}</PlayerChromeContext.Provider>
}

export function usePlayerChrome() {
    return useContext(PlayerChromeContext)
}
