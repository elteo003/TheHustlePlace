'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { CopyButton } from '@/components/copy-button'
import { fadeUp, springTransition } from '@/lib/motion'
import { formatPairCode, isValidPairCode, normalizePairCode } from '@/lib/pair-code'

interface DeviceCodeDialogProps {
    open: boolean
    onClose: () => void
}

export function DeviceCodeDialog({ open, onClose }: DeviceCodeDialogProps) {
    const [code, setCode] = useState<string | null>(null)
    const [paste, setPaste] = useState('')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (!open) {
            return
        }

        let cancelled = false
        setError(null)
        setPaste('')

        void (async () => {
            try {
                const response = await fetch('/api/device')
                const data = (await response.json()) as { code?: string }
                if (!cancelled) {
                    setCode(data.code ?? null)
                }
            } catch {
                if (!cancelled) {
                    setCode(null)
                }
            }
        })()

        return () => {
            cancelled = true
        }
    }, [open])

    useEffect(() => {
        if (!open) {
            return
        }
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose()
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, onClose])

    async function pair(event: React.FormEvent) {
        event.preventDefault()
        if (!isValidPairCode(paste) || busy) {
            return
        }

        setBusy(true)
        setError(null)

        try {
            const response = await fetch('/api/device', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: paste }),
            })
            const data = (await response.json()) as { ok?: boolean; error?: string; code?: string }

            if (data.ok && data.code) {
                setCode(data.code)
                setPaste('')
                window.dispatchEvent(new CustomEvent('watch-history-updated'))
                window.setTimeout(onClose, 400)
                return
            }

            if (data.error === 'self') {
                setError('È già questo dispositivo.')
            } else {
                setError('Codice non valido.')
            }
        } catch {
            setError('Riprova tra un attimo.')
        } finally {
            setBusy(false)
        }
    }

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.button
                        type="button"
                        aria-label="Chiudi"
                        className="fixed inset-0 z-[60] bg-black/50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        onClick={onClose}
                    />
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="device-code-title"
                        className="fixed left-1/2 top-[22%] z-[61] w-[min(92vw,360px)] -translate-x-1/2 rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                        transition={springTransition}
                    >
                        <button
                            type="button"
                            onClick={onClose}
                            className="absolute right-3 top-3 rounded-md p-1.5 text-white/35 transition-colors hover:bg-white/[0.06] hover:text-white"
                            aria-label="Chiudi"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <h2 id="device-code-title" className="text-[13px] font-medium text-white/45">
                            Questo dispositivo
                        </h2>

                        <div className="mt-4 flex items-center justify-center gap-3">
                            <p className="font-mono text-[28px] font-medium tracking-[0.18em] text-white">
                                {code ?? '········'}
                            </p>
                            <CopyButton value={code ?? ''} disabled={!code} />
                        </div>

                        <div className="my-5 h-px bg-white/[0.08]" />

                        <form onSubmit={(event) => void pair(event)}>
                            <label htmlFor="pair-code-input" className="text-[13px] text-white/45">
                                Unisci un altro dispositivo
                            </label>
                            <input
                                ref={inputRef}
                                id="pair-code-input"
                                value={paste}
                                autoComplete="off"
                                autoCapitalize="characters"
                                spellCheck={false}
                                placeholder="XXXX-XXXX"
                                onChange={(event) => {
                                    setError(null)
                                    const raw = normalizePairCode(event.target.value).slice(0, 8)
                                    setPaste(raw.length <= 4 ? raw : formatPairCode(raw))
                                }}
                                className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 font-mono text-sm tracking-[0.18em] text-white placeholder:text-white/20 outline-none transition-colors focus:border-white/25"
                            />
                            {error && (
                                <motion.p {...fadeUp} className="mt-2 text-[12px] text-white/50">
                                    {error}
                                </motion.p>
                            )}
                            <button
                                type="submit"
                                disabled={!isValidPairCode(paste) || busy}
                                className="mt-3 w-full rounded-full bg-white py-2 text-[13px] font-medium text-black transition-transform duration-150 ease-out hover:bg-[#fafafa] active:scale-[0.97] disabled:pointer-events-none disabled:bg-white/10 disabled:text-white/20"
                            >
                                Unisci
                            </button>
                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
