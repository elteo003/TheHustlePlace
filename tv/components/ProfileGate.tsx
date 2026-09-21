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
import { cn } from '@/lib/utils'
import { avatarArtSrc } from '@/tv/lib/avatars'
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
    const canAdd = canAddHouseholdProfile(profiles.length)
    const railShift = railIndex <= 1 ? 0 : railIndex - 1
    const artSrc = focused ? avatarArtSrc(focused.avatar) : null

    return (
        <div className="relative h-full min-h-[100dvh] w-full overflow-hidden">
            <h1 className="pointer-events-none absolute inset-x-0 top-[5.5vh] z-10 text-center text-5xl font-semibold text-white [text-shadow:0_10px_32px_#000]">
                Chi vuole guardare la tv?
            </h1>
            {!configured && error ? (
                <p className="absolute inset-x-0 top-[14vh] z-10 text-center text-lg text-white/45">
                    Senza database i profili restano solo su questa TV.
                </p>
            ) : null}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-[18vh] bg-gradient-to-b from-black from-[18%] to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[18vh] bg-gradient-to-t from-black from-[18%] to-transparent" />
            <div className="pointer-events-none absolute left-1/2 top-[18vh] z-[6] w-[360px] -translate-x-1/2 text-center">
                <p
                    className={cn(
                        'text-[44px] font-bold text-white [text-shadow:0_8px_28px_#000]',
                        artSrc ? 'mb-4' : 'mb-5'
                    )}
                >
                    {focused ? focused.name : 'Aggiungi'}
                </p>
                {artSrc ? (
                    <div className="relative mx-auto mb-7 h-[300px] w-[300px]" aria-hidden>
                        {shown.map((profile) => {
                            const src = avatarArtSrc(profile.avatar)
                            if (!src) return null
                            return (
                                <img
                                    key={profile.id}
                                    src={src}
                                    alt=""
                                    className={cn(
                                        'pointer-events-none absolute left-0 top-0 h-full w-full object-contain object-center transition-opacity duration-[240ms] ease-[cubic-bezier(0.645,0.045,0.355,1)] motion-reduce:transition-none [filter:drop-shadow(0_12px_18px_rgba(0,0,0,.55))]',
                                        profile.id === focused.id ? 'opacity-100' : 'opacity-0'
                                    )}
                                />
                            )
                        })}
                    </div>
                ) : null}
                <div className="pointer-events-auto flex justify-center">
                    {focused && focused.id !== 'local' ? (
                        <TvFocus
                            onClick={() => {
                                setSelected(focused)
                                setView('edit')
                            }}
                            className="mx-2.5 h-14 rounded-[10px] bg-white/[0.08] px-7 text-lg text-white"
                        >
                            Modifica
                        </TvFocus>
                    ) : null}
                    {focused && configured && focused.pairCode ? (
                        <TvFocus
                            onClick={() => {
                                setSelected(focused)
                                setView('code')
                            }}
                            className="mx-2.5 h-14 rounded-[10px] bg-white/[0.08] px-7 text-lg text-white"
                        >
                            Collega
                        </TvFocus>
                    ) : null}
                </div>
            </div>
            <div className="flex h-full items-start pl-[4.5vw]">
                <div className="h-full w-40 shrink-0 overflow-visible py-[12vh]">
                    <div
                        className="motion-reduce:transition-none"
                        style={{
                            transform: `translateY(${-railShift * 12.5}rem)`,
                            transitionProperty: 'transform',
                            transitionDuration: '240ms',
                            transitionTimingFunction: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
                        }}
                    >
                        {shown.map((profile, index) => (
                            <div key={profile.id} className="h-[12.5rem]">
                                <TvFocus
                                    autoFocusItem={index === 0}
                                    onFocus={() => setRailIndex(index)}
                                    onClick={() => void enter(profile)}
                                    className="gate-avatar flex h-40 w-40 overflow-hidden rounded-2xl p-0"
                                >
                                    <ProfileAvatar
                                        avatar={profile.avatar}
                                        name={profile.name}
                                        className="h-full w-full"
                                        initialClassName="text-6xl"
                                    />
                                </TvFocus>
                            </div>
                        ))}
                        {canAdd ? (
                            <div className="h-[12.5rem]">
                                <TvFocus
                                    onFocus={() => setRailIndex(shown.length)}
                                    onClick={() => setView('create')}
                                    className="gate-avatar flex h-40 w-40 items-center justify-center rounded-2xl border-2 border-dashed border-white/25 text-6xl text-white/70"
                                >
                                    +
                                </TvFocus>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
            {configured ? (
                <div className="absolute inset-x-0 bottom-[6.5vh] z-[7] text-center">
                    <TvFocus
                        onClick={() => setView('adopt')}
                        className="gate-code-btn relative px-[72px] py-[22px] text-[22px] font-semibold text-white/80"
                    >
                        Ho un codice
                    </TvFocus>
                </div>
            ) : null}
            {error && view === 'pick' ? (
                <p className="absolute inset-x-0 bottom-[16vh] z-[7] text-center text-lg text-white/55">{error}</p>
            ) : null}
        </div>
    )
}
