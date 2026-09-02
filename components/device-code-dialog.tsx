'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { CopyButton } from '@/components/copy-button'
import { fadeUp, sheetEase, springTransition } from '@/lib/motion'
import { formatPairCode, isValidPairCode, normalizePairCode, splitPairCode } from '@/lib/pair-code'
import { useMediaQuery, useReducedMotion } from '@/hooks/useMediaQuery'
import { shouldDismissSheet } from '@/lib/sheet-gesture'

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
    const isPhone = useMediaQuery('(max-width: 639px)')
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
        </>
    )

    const phoneTransition = reduceMotion
        ? { duration: 0.15, ease: 'easeOut' as const }
        : { duration: 0.2, ease: sheetEase }
    const phoneExit = reduceMotion
        ? { duration: 0.1 }
        : { duration: 0.16, ease: sheetEase }

    const overlay = (
        <AnimatePresence>
            {open && (
                <motion.button
                    key="device-code-backdrop"
                    type="button"
                    aria-label="Chiudi"
                    className="fixed inset-0 z-[60] bg-black/50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18, ease: sheetEase }}
                    onClick={onClose}
                />
            )}
            {open && (
                <motion.div
                    key="device-code-sheet"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="device-code-title"
                    className={
                        isPhone
                            ? 'fixed inset-x-0 bottom-0 z-[61] flex max-h-[min(90dvh,640px)] flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-zinc-950 shadow-[0_24px_80px_rgba(0,0,0,0.55)]'
                            : 'fixed left-1/2 top-[22%] z-[61] w-[min(92vw,360px)] -translate-x-1/2 rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)]'
                    }
                    style={isPhone ? { maxHeight: 'min(90dvh, 640px)' } : undefined}
                    initial={
                        isPhone
                            ? reduceMotion
                                ? { opacity: 0 }
                                : { y: '100%' }
                            : { opacity: 0, y: 10, scale: 0.98 }
                    }
                    animate={
                        isPhone
                            ? reduceMotion
                                ? { opacity: 1 }
                                : { y: 0 }
                            : { opacity: 1, y: 0, scale: 1 }
                    }
                    exit={
                        isPhone
                            ? reduceMotion
                                ? { opacity: 0, transition: phoneExit }
                                : { y: '100%', transition: phoneExit }
                            : { opacity: 0, y: 6, scale: 0.98 }
                    }
                    transition={isPhone ? phoneTransition : springTransition}
                    drag={isPhone && !reduceMotion ? 'y' : false}
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={0.18}
                    onDragEnd={(_event: unknown, info: { offset: { y: number }; velocity: { y: number } }) => {
                        if (isPhone && shouldDismissSheet(info.offset.y, info.velocity.y)) {
                            onClose()
                        }
                    }}
                >
                    {isPhone ? (
                        <div className="min-h-0 overflow-y-auto px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3">
                            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/25" aria-hidden />
                            {body}
                        </div>
                    ) : (
                        body
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    )

    if (!portalReady) {
        return null
    }

    return createPortal(overlay, document.body)
}
