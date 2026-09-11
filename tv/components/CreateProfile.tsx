'use client'

import { useState } from 'react'
import { PROFILE_NAME_MAX, sanitizeProfileName } from '@/tv/lib/household-rules'
import { packAvatar, TV_AVATAR_ART, TV_AVATARS, unpackAvatar } from '@/tv/lib/avatars'
import { ProfileAvatar } from '@/tv/components/ProfileAvatar'
import { TvFocus } from '@/tv/components/TvFocus'
import { TvKeyboard } from '@/tv/components/TvKeyboard'

interface CreateProfileProps {
    error?: string | null
    title?: string
    submitLabel?: string
    initialName?: string
    initialAvatar?: number
    onSubmit: (name: string, avatar: number) => Promise<boolean>
    onCancel: () => void
}

export function CreateProfile({
    error,
    title = 'Nuovo profilo',
    submitLabel = 'Crea',
    initialName = '',
    initialAvatar = 0,
    onSubmit,
    onCancel,
}: CreateProfileProps) {
    const [name, setName] = useState(initialName)
    const [avatar, setAvatar] = useState(initialAvatar)
    const [busy, setBusy] = useState(false)
    const picked = unpackAvatar(avatar)

    function addChar(char: string) {
        setName((current) => sanitizeProfileName(`${current}${char}`))
    }

    async function submit() {
        const clean = sanitizeProfileName(name)
        if (!clean || busy) return
        setBusy(true)
        try {
            await onSubmit(clean, avatar)
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className="flex flex-col items-center">
            <h1 className="text-4xl font-semibold text-white">{title}</h1>
            <ProfileAvatar
                avatar={avatar}
                name={name || 'N'}
                className="mt-8 h-40 w-40 rounded-2xl"
                initialClassName="text-6xl"
            />
            <p className="mt-6 min-h-[4.5rem] font-medium text-5xl tracking-wide text-white">
                {name || <span className="text-white/25">Nome</span>}
            </p>
            <p className="mt-2 text-sm uppercase tracking-[0.08em] text-white/45">Colore</p>
            <div className="mt-3 flex gap-3">
                {TV_AVATARS.map((item, index) => (
                    <TvFocus
                        key={item.label}
                        autoFocusItem={index === 0}
                        onClick={() => setAvatar(packAvatar(index, picked.art))}
                        className="h-16 w-16 rounded-full"
                        style={{
                            background: item.bg,
                            boxShadow: picked.color === index ? '0 0 0 4px #fff' : undefined,
                        }}
                        aria-label={item.label}
                    />
                ))}
            </div>
            <p className="mt-6 text-sm uppercase tracking-[0.08em] text-white/45">Personaggio</p>
            <div className="mt-3 flex flex-wrap justify-center gap-3">
                <TvFocus
                    onClick={() => setAvatar(packAvatar(picked.color, 0))}
                    className="flex h-16 w-16 overflow-hidden rounded-xl p-0"
                    style={{ boxShadow: picked.art === 0 ? '0 0 0 4px #fff' : undefined }}
                    aria-label="Iniziale"
                >
                    <ProfileAvatar avatar={packAvatar(picked.color, 0)} name={name || 'N'} className="h-full w-full" initialClassName="text-2xl" />
                </TvFocus>
                {TV_AVATAR_ART.map((item, index) => {
                    const art = index + 1
                    return (
                        <TvFocus
                            key={item.file}
                            onClick={() => setAvatar(packAvatar(picked.color, art))}
                            className="flex h-16 w-16 overflow-hidden rounded-xl p-0"
                            style={{ boxShadow: picked.art === art ? '0 0 0 4px #fff' : undefined }}
                            aria-label={item.name}
                        >
                            <ProfileAvatar
                                avatar={packAvatar(picked.color, art)}
                                name={item.name}
                                className="h-full w-full"
                            />
                        </TvFocus>
                    )
                })}
            </div>
            <div className="mt-10">
                <TvKeyboard
                    onChar={addChar}
                    onDelete={() => setName((current) => current.slice(0, -1))}
                    onSubmit={() => void submit()}
                    submitLabel={submitLabel}
                />
            </div>
            <p className="mt-3 text-base text-white/35">{name.length}/{PROFILE_NAME_MAX}</p>
            {error && <p className="mt-3 text-lg text-white/60">{error}</p>}
            <TvFocus onClick={onCancel} className="mt-6 h-14 rounded-lg bg-white/10 px-8 text-lg text-white">
                Indietro
            </TvFocus>
            {busy && <p className="sr-only">Salvataggio in corso</p>}
        </div>
    )
}
