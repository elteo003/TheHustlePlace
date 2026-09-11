'use client'

import { useState } from 'react'
import { PROFILE_NAME_MAX, sanitizeProfileName } from '@/tv/lib/household-rules'
import { TV_AVATARS } from '@/tv/lib/avatars'
import { TvFocus } from '@/tv/components/TvFocus'
import { TvKeyboard } from '@/tv/components/TvKeyboard'

interface CreateProfileProps {
    error?: string | null
    onSubmit: (name: string, avatar: number) => Promise<boolean>
    onCancel: () => void
}

export function CreateProfile({ error, onSubmit, onCancel }: CreateProfileProps) {
    const [name, setName] = useState('')
    const [avatar, setAvatar] = useState(0)
    const [busy, setBusy] = useState(false)

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
            <h1 className="text-4xl font-semibold text-white">Nuovo profilo</h1>
            <p className="mt-8 min-h-[4.5rem] font-medium text-5xl tracking-wide text-white">
                {name || <span className="text-white/25">Nome</span>}
            </p>
            <div className="mt-6 flex gap-3">
                {TV_AVATARS.map((item, index) => (
                    <TvFocus
                        key={item.label}
                        autoFocusItem={index === 0}
                        onClick={() => setAvatar(index)}
                        className="h-16 w-16 rounded-full"
                        style={{
                            background: item.bg,
                            boxShadow: avatar === index ? '0 0 0 4px #fff' : undefined,
                        }}
                        aria-label={item.label}
                    />
                ))}
            </div>
            <div className="mt-10">
                <TvKeyboard
                    onChar={addChar}
                    onDelete={() => setName((current) => current.slice(0, -1))}
                    onSubmit={() => void submit()}
                    submitLabel="Crea"
                />
            </div>
            <p className="mt-3 text-base text-white/35">{name.length}/{PROFILE_NAME_MAX}</p>
            {error && <p className="mt-3 text-lg text-white/60">{error}</p>}
            <TvFocus onClick={onCancel} className="mt-6 h-14 rounded-lg bg-white/10 px-8 text-lg text-white">
                Indietro
            </TvFocus>
            {busy && <p className="sr-only">Creazione in corso</p>}
        </div>
    )
}
