'use client'

import { useEffect, useState } from 'react'
import { formatPairCode, PAIR_CODE_LENGTH } from '@/lib/pair-code'
import { TvFocus } from '@/tv/components/TvFocus'
import { appendPairChar, PAIR_PAD_ROWS } from '@/tv/lib/pair-keys'

interface PairCodePadProps {
    title: string
    hint?: string
    error?: string | null
    onSubmit: (code: string) => Promise<boolean> | boolean
    onCancel: () => void
}

export function PairCodePad({ title, hint, error, onSubmit, onCancel }: PairCodePadProps) {
    const [value, setValue] = useState('')
    const [busy, setBusy] = useState(false)

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key >= '0' && event.key <= '9') {
                setValue((current) => appendPairChar(current, event.key))
            }
            if (event.key === 'Backspace') {
                setValue((current) => current.slice(0, -1))
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])

    async function submit() {
        if (value.length !== PAIR_CODE_LENGTH || busy) return
        setBusy(true)
        try {
            await onSubmit(value)
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className="flex flex-col items-center">
            <h1 className="text-4xl font-semibold text-white">{title}</h1>
            {hint && <p className="mt-3 max-w-2xl text-center text-xl text-white/55">{hint}</p>}
            <p className="mt-8 font-mono text-6xl tracking-[0.18em] text-white">
                {formatPairCode(value.padEnd(PAIR_CODE_LENGTH, '·'))}
            </p>
            <div className="mt-10 flex flex-col gap-2">
                {PAIR_PAD_ROWS.map((row) => (
                    <div key={row.join('')} className="flex justify-center gap-2">
                        {row.map((key, index) => (
                            <TvFocus
                                key={key}
                                autoFocusItem={index === 0 && row[0] === 'A'}
                                onClick={() => setValue((current) => appendPairChar(current, key))}
                                className="flex h-16 w-16 items-center justify-center rounded-lg bg-white/10 text-2xl font-semibold text-white"
                            >
                                {key}
                            </TvFocus>
                        ))}
                    </div>
                ))}
            </div>
            {error && <p className="mt-5 text-lg text-white/60">{error}</p>}
            <div className="mt-8 flex gap-3">
                <TvFocus onClick={onCancel} className="h-14 rounded-lg bg-white/10 px-8 text-lg text-white">
                    Indietro
                </TvFocus>
                <TvFocus
                    onClick={() => void submit()}
                    disabled={value.length !== PAIR_CODE_LENGTH || busy}
                    className="h-14 rounded-lg bg-white px-8 text-lg font-semibold text-black disabled:bg-white/15 disabled:text-white/30"
                >
                    Unisci
                </TvFocus>
            </div>
        </div>
    )
}
