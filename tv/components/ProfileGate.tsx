'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { canAddHouseholdProfile } from '@/tv/lib/household-rules'
import { avatarColor, avatarInitial } from '@/tv/lib/avatars'
import { livingHomePath } from '@/tv/lib/paths'
import { useHousehold } from '@/tv/hooks/useHousehold'
import { focusFirstTvNode } from '@/tv/hooks/useSpatialNavigation'
import { CreateProfile } from '@/tv/components/CreateProfile'
import { PairCodePad } from '@/tv/components/PairCodePad'
import { TvFocus } from '@/tv/components/TvFocus'
import { formatPairCode } from '@/lib/pair-code'
import { TvProfile } from '@/tv/lib/types'

type GateView = 'pick' | 'create' | 'adopt' | 'code'

export function ProfileGate() {
    const router = useRouter()
    const { profiles, loading, error, configured, createProfile, switchProfile, adoptCode } = useHousehold()
    const [view, setView] = useState<GateView>('pick')
    const [selected, setSelected] = useState<TvProfile | null>(null)

    useEffect(() => {
        if (loading || view !== 'pick') return
        const frame = window.requestAnimationFrame(() => focusFirstTvNode())
        return () => window.cancelAnimationFrame(frame)
    }, [loading, view, profiles.length])

    async function enter(profile: TvProfile) {
        if (profile.id !== 'local') {
            const ok = await switchProfile(profile.id)
            if (!ok) return
        }
        router.push(livingHomePath())
    }

    if (view === 'create') {
        return (
            <CreateProfile
                error={error}
                onCancel={() => setView('pick')}
                onSubmit={async (name, avatar) => {
                    const ok = await createProfile(name, avatar)
                    if (ok) setView('pick')
                    return ok
                }}
            />
        )
    }

    if (view === 'adopt') {
        return (
            <PairCodePad
                title="Ho un codice"
                hint="Inserisci il codice che vedi sul telefono o sul computer."
                error={error}
                onCancel={() => setView('pick')}
                onSubmit={async (code) => {
                    const ok = await adoptCode(code)
                    if (ok) setView('pick')
                    return ok
                }}
            />
        )
    }

    if (view === 'code' && selected) {
        return (
            <div className="flex flex-col items-center">
                <h1 className="text-4xl font-semibold text-white">Collega {selected.name}</h1>
                <p className="mt-4 max-w-2xl text-center text-xl text-white/55">
                    Sul telefono apri Codice e inserisci questo valore.
                </p>
                <p className="mt-10 font-mono text-7xl tracking-[0.18em] text-white">
                    {selected.pairCode ? formatPairCode(selected.pairCode) : '—'}
                </p>
                <TvFocus
                    autoFocusItem
                    onClick={() => setView('pick')}
                    className="mt-12 h-14 rounded-lg bg-white px-10 text-lg font-semibold text-black"
                >
                    Fatto
                </TvFocus>
            </div>
        )
    }

    return (
        <div className="flex w-full flex-col items-center">
            <h1 className="text-5xl font-semibold text-white">Chi guarda?</h1>
            {loading && <p className="mt-8 text-2xl text-white/50">Caricamento profili…</p>}
            {!loading && !configured && (
                <p className="mt-4 text-lg text-white/45">Senza database i profili restano solo su questa TV.</p>
            )}
            {!loading && (
                <div className="mt-14 flex flex-wrap justify-center gap-8">
                    {profiles.map((profile, index) => (
                        <div key={profile.id} className="flex flex-col items-center gap-3">
                            <TvFocus
                                autoFocusItem={index === 0}
                                onClick={() => void enter(profile)}
                                className="flex h-40 w-40 flex-col items-center justify-center rounded-2xl"
                                style={{ background: avatarColor(profile.avatar) }}
                            >
                                <span className="text-6xl font-semibold text-white">{avatarInitial(profile.name)}</span>
                            </TvFocus>
                            <p className="text-2xl text-white">{profile.name}</p>
                            {configured && profile.pairCode && (
                                <TvFocus
                                    onClick={() => {
                                        setSelected(profile)
                                        setView('code')
                                    }}
                                    className="rounded-md px-3 py-2 text-base text-white/55"
                                >
                                    Collega telefono
                                </TvFocus>
                            )}
                        </div>
                    ))}
                    {canAddHouseholdProfile(profiles.length) && (
                        <div className="flex flex-col items-center gap-3">
                            <TvFocus
                                onClick={() => setView('create')}
                                className="flex h-40 w-40 items-center justify-center rounded-2xl border-2 border-dashed border-white/25 text-6xl text-white/70"
                            >
                                +
                            </TvFocus>
                            <p className="text-2xl text-white/70">Aggiungi</p>
                        </div>
                    )}
                </div>
            )}
            {configured && !loading && (
                <TvFocus
                    onClick={() => setView('adopt')}
                    className="mt-12 h-14 rounded-lg bg-white/10 px-8 text-lg text-white"
                >
                    Ho un codice
                </TvFocus>
            )}
            {error && view === 'pick' && <p className="mt-6 text-lg text-white/55">{error}</p>}
        </div>
    )
}
