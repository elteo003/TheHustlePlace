'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Cpu } from 'lucide-react'
import { CopyButton } from '@/components/copy-button'
import { fadeUp } from '@/lib/motion'
import { formatPairCode, isValidPairCode, normalizePairCode, splitPairCode } from '@/lib/pair-code'
import { useReducedMotion } from '@/hooks/useMediaQuery'

interface DeviceCodeDialogProps {
    open: boolean
    onClose: () => void
}

export function DeviceCodeDialog({ open, onClose }: DeviceCodeDialogProps) {
    const [code, setCode] = useState<string | null>(null)
    const [paste, setPaste] = useState('')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [portalReady, setPortalReady] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const reduceMotion = useReducedMotion()
    const groups = code ? splitPairCode(code) : { left: '····', right: '····' }

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
        setPortalReady(true)
    }, [])

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
                body: JSON.stringify({ code: paste, mode: 'adopt' }),
            })
            const data = (await response.json()) as { ok?: boolean; error?: string; code?: string }

            if (data.ok) {
                if (data.code) setCode(data.code)
                setPaste('')
                window.dispatchEvent(new CustomEvent('watch-history-updated'))
                window.setTimeout(onClose, 400)
                return
            }

            if (data.error === 'self') {
                setError('È già questo dispositivo.')
            } else if (data.error === 'full') {
                setError('Hai già 8 profili.')
            } else {
                setError('Codice non valido.')
            }
        } catch {
            setError('Riprova tra un attimo.')
        } finally {
            setBusy(false)
        }
    }

    const formatted = code ? formatPairCode(code) : ''

    const body = (
        <>
            <button
                type="button"
                onClick={onClose}
                className={`absolute right-3 top-3 rounded-md p-1.5 text-white/35 transition-colors hover:bg-white/[0.06] hover:text-white`}
                aria-label="Chiudi"
            >
                <X className="h-4 w-4" />
            </button>

            <h2 id="device-code-title" className="text-[13px] font-medium text-white/45">
                Questo dispositivo
            </h2>

            <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <p className="flex items-baseline justify-center gap-2 font-mono text-[22px] font-medium tracking-[0.12em] text-white sm:text-[28px] sm:tracking-[0.18em]">
                    <span>{groups.left || '····'}</span>
                    <span className="text-white/25">-</span>
                    <span>{groups.right || '····'}</span>
                </p>
                <CopyButton value={formatted} disabled={!code} />
            </div>

            <div className="my-5 h-px bg-white/[0.08]" />

            <form
                onSubmit={(event) => void pair(event)}
                onPointerDown={(event) => event.stopPropagation()}
            >
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

            {((code && normalizePairCode(code) === 'M7BYZ77K') || normalizePairCode(paste) === 'M7BYZ77K') && (
                <div className="mt-4 pt-3.5 border-t border-white/[0.08] flex justify-center">
                    <Link
                        href="/admin"
                        onClick={onClose}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-semibold hover:bg-cyan-900/60 active:scale-95 transition-all shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                    >
                        <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Pannello Admin ML [Apri ➔]</span>
                    </Link>
                </div>
            )}
        </>
    )

    const overlay = (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <motion.div
                        key="device-code-backdrop"
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                        onClick={onClose}
                    />

                    <motion.div
                        key="device-code-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="device-code-title"
                        className="relative z-10 w-full max-w-[380px] overflow-hidden rounded-2xl border border-white/12 bg-zinc-950 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.7)]"
                        initial={
                            reduceMotion
                                ? { opacity: 0 }
                                : { opacity: 0, scale: 0.94, y: 10 }
                        }
                        animate={
                            reduceMotion
                                ? { opacity: 1 }
                                : { opacity: 1, scale: 1, y: 0 }
                        }
                        exit={
                            reduceMotion
                                ? { opacity: 0 }
                                : { opacity: 0, scale: 0.96, y: 6 }
                        }
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {body}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )

    if (!portalReady) {
        return null
    }

    return createPortal(overlay, document.body)
}
