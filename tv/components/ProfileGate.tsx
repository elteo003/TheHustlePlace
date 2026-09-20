'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { canAddHouseholdProfile, visibleHouseholdProfiles } from '@/tv/lib/household-rules'
import { hideTvProfileId, readHiddenTvProfileIds, TV_HIDDEN_PROFILES_KEY, withoutHiddenTvProfiles } from '@/tv/lib/hidden-profiles'
import { livingHomePath } from '@/tv/lib/paths'
import { useHousehold } from '@/tv/hooks/useHousehold'
import { focusFirstTvNode } from '@/tv/hooks/useSpatialNavigation'
import { CreateProfile } from '@/tv/components/CreateProfile'
import { ProfileAvatar } from '@/tv/components/ProfileAvatar'
import { PairCodePad } from '@/tv/components/PairCodePad'
import { TvFocus } from '@/tv/components/TvFocus'
import { formatPairCode } from '@/lib/pair-code'
import { TvProfile } from '@/tv/lib/types'

type GateView = 'pick' | 'create' | 'edit' | 'adopt' | 'code'

export function ProfileGate() {
    const router = useRouter()
    const { profiles, loading, error, configured, createProfile, updateProfile, switchProfile, adoptCode } =
        useHousehold()
    const [view, setView] = useState<GateView>('pick')
    const [selected, setSelected] = useState<TvProfile | null>(null)
    const [railIndex, setRailIndex] = useState(0)
    const [hiddenIds, setHiddenIds] = useState<string[]>(() => {
        try {
            return readHiddenTvProfileIds(window.localStorage.getItem(TV_HIDDEN_PROFILES_KEY))
        } catch {
            return []
        }
    })
    const shown = withoutHiddenTvProfiles(visibleHouseholdProfiles(profiles), hiddenIds)

    function hideOnTv(profileId: string) {
        const next = hideTvProfileId(hiddenIds, profileId)
        setHiddenIds(next)
        try {
            window.localStorage.setItem(TV_HIDDEN_PROFILES_KEY, JSON.stringify(next))
        } catch {
            // restiamo in memoria
        }
    }

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

    if (loading && view === 'pick') {
        return (
            <div className="flex min-h-[70vh] items-center justify-center" aria-hidden>
                <div className="flex h-20 w-20 items-center justify-center rounded-[22px] bg-white text-4xl font-bold text-black">
                    H
                </div>
            </div>
        )
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

    if (view === 'edit' && selected) {
        return (
            <CreateProfile
                title="Modifica profilo"
                submitLabel="Salva"
                initialName={selected.name}
                initialAvatar={selected.avatar}
                error={error}
                onCancel={() => {
                    setSelected(null)
                    setView('pick')
                }}
                onSubmit={async (name, avatar) => {
                    const ok = await updateProfile(selected.id, name, avatar)
                    if (ok) {
                        setSelected(null)
                        setView('pick')
                    }
                    return ok
                }}
                onHide={() => {
                    hideOnTv(selected.id)
                    setSelected(null)
                    setView('pick')
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

    const focused = shown[railIndex]
    const railShift = railIndex <= 1 ? 0 : railIndex - 1

    return (
        <div className="flex w-full flex-col items-start px-10">
            <h1 className="text-5xl font-semibold text-white">Chi guarda?</h1>
            {!configured && error ? (
                <p className="mt-4 text-lg text-white/45">Senza database i profili restano solo su questa TV.</p>
            ) : null}
            <div className="mt-10 flex items-start">
                <div className="h-[29.5rem] w-56 overflow-hidden">
                    <div
                        className="motion-reduce:transition-none"
                        style={{
                            transform: `translateY(${-railShift * 13.5}rem)`,
                            transitionProperty: 'transform',
                            transitionDuration: '240ms',
                            transitionTimingFunction: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
                        }}
                    >
                        {shown.map((profile, index) => (
                            <div key={profile.id} className="mb-6 h-[12rem]">
                                <TvFocus
                                    autoFocusItem={index === 0}
                                    onFocus={() => setRailIndex(index)}
                                    onClick={() => void enter(profile)}
                                    className="flex h-40 w-40 overflow-hidden rounded-2xl p-0"
                                >
                                    <ProfileAvatar
                                        avatar={profile.avatar}
                                        name={profile.name}
                                        className="h-full w-full"
                                        initialClassName="text-6xl"
                                    />
                                </TvFocus>
                                <p className="mt-2 text-2xl text-white">{profile.name}</p>
                            </div>
                        ))}
                        {canAddHouseholdProfile(profiles.length) && (
                            <div className="h-[12rem]">
                                <TvFocus
                                    onFocus={() => setRailIndex(shown.length)}
                                    onClick={() => setView('create')}
                                    className="flex h-40 w-40 items-center justify-center rounded-2xl border-2 border-dashed border-white/25 text-6xl text-white/70"
                                >
                                    +
                                </TvFocus>
                                <p className="mt-2 text-2xl text-white/70">Aggiungi</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="min-w-[280px] pl-14 pt-2">
                    <p className="text-4xl font-semibold text-white">{focused ? focused.name : 'Aggiungi'}</p>
                    <p className="mt-2 text-lg text-white/45">
                        {focused ? 'OK sul riquadro per entrare.' : 'OK per creare un profilo.'}
                    </p>
                    {focused && focused.id !== 'local' && (
                        <TvFocus
                            onClick={() => {
                                setSelected(focused)
                                setView('edit')
                            }}
                            className="mt-8 block h-14 w-60 rounded-lg bg-white/10 px-6 text-lg text-white"
                        >
                            Modifica
                        </TvFocus>
                    )}
                    {focused && configured && focused.pairCode && (
                        <TvFocus
                            onClick={() => {
                                setSelected(focused)
                                setView('code')
                            }}
                            className="mt-3 block h-14 w-60 rounded-lg bg-white/10 px-6 text-lg text-white"
                        >
                            Collega telefono
                        </TvFocus>
                    )}
                    {configured && (
                        <TvFocus
                            onClick={() => setView('adopt')}
                            className="mt-3 block h-14 w-60 rounded-lg bg-white/10 px-6 text-lg text-white"
                        >
                            Ho un codice
                        </TvFocus>
                    )}
                </div>
            </div>
            {error && view === 'pick' && <p className="mt-6 text-lg text-white/55">{error}</p>}
        </div>
    )
}
