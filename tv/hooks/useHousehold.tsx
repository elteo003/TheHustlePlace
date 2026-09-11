'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { TvHouseholdState, TvProfile } from '@/tv/lib/types'

const emptyState: TvHouseholdState = {
    configured: false,
    householdId: null,
    activeProfileId: 'local',
    profiles: [{ id: 'local', name: 'Ospite', avatar: 0, pairCode: null }],
}

interface HouseholdContextValue extends TvHouseholdState {
    loading: boolean
    error: string | null
    activeProfile: TvProfile | undefined
    refresh: () => Promise<void>
    createProfile: (name: string, avatar: number) => Promise<boolean>
    switchProfile: (profileId: string) => Promise<boolean>
    adoptCode: (code: string) => Promise<boolean>
}

const HouseholdContext = createContext<HouseholdContextValue | null>(null)

function applySnapshot(data: Partial<TvHouseholdState> & { profiles?: TvProfile[] }): TvHouseholdState {
    return {
        configured: Boolean(data.configured),
        householdId: data.householdId ?? null,
        activeProfileId: data.activeProfileId ?? emptyState.activeProfileId,
        profiles: data.profiles ?? emptyState.profiles,
    }
}

export function HouseholdProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<TvHouseholdState>(emptyState)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const refresh = useCallback(async () => {
        try {
            const response = await fetch('/api/household')
            const data = (await response.json()) as TvHouseholdState & { error?: string }
            if (!response.ok) {
                setError('Impossibile caricare i profili')
                return
            }
            setState(applySnapshot(data))
            setError(null)
        } catch {
            setError('Impossibile caricare i profili')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        void refresh()
    }, [refresh])

    const createProfile = useCallback(async (name: string, avatar: number) => {
        setError(null)
        const response = await fetch('/api/household/profiles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, avatar }),
        })
        const data = await response.json()
        if (!response.ok) {
            setError(data.error === 'full' ? 'Hai già 5 profili.' : 'Non siamo riusciti a creare il profilo.')
            return false
        }
        setState(applySnapshot(data))
        return true
    }, [])

    const switchProfile = useCallback(async (profileId: string) => {
        const response = await fetch('/api/household/switch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profileId }),
        })
        const data = await response.json()
        if (!response.ok) return false
        setState(applySnapshot(data))
        window.dispatchEvent(new CustomEvent('watch-history-updated'))
        return true
    }, [])

    const adoptCode = useCallback(async (code: string) => {
        setError(null)
        const response = await fetch('/api/device', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, mode: 'adopt' }),
        })
        const data = await response.json()
        if (!response.ok) {
            setError(data.error === 'full' ? 'Hai già 5 profili.' : 'Codice non valido.')
            return false
        }
        await refresh()
        window.dispatchEvent(new CustomEvent('watch-history-updated'))
        return true
    }, [refresh])

    const activeProfile = state.profiles.find((item) => item.id === state.activeProfileId)
    const value = useMemo(
        () => ({
            ...state,
            loading,
            error,
            activeProfile,
            refresh,
            createProfile,
            switchProfile,
            adoptCode,
        }),
        [state, loading, error, activeProfile, refresh, createProfile, switchProfile, adoptCode]
    )

    return <HouseholdContext.Provider value={value}>{children}</HouseholdContext.Provider>
}

export function useHousehold(): HouseholdContextValue {
    const ctx = useContext(HouseholdContext)
    if (!ctx) {
        throw new Error('useHousehold deve stare dentro HouseholdProvider')
    }
    return ctx
}
