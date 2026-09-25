'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, type Transition, type Variants } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import { useReducedMotion } from '@/hooks/useMediaQuery'
import { dockEase, sheetEase } from '@/lib/motion'

const TMDB_API_SETTINGS = 'https://www.themoviedb.org/settings/api'

const STEPS = [
    'Apri le impostazioni API di TMDB e crea un account gratuito.',
    'Richiedi una chiave e copiala.',
    'Incollala in .env.local, al posto del segnaposto.',
    'Ricarica. Il catalogo riparte da solo.',
]

interface ApiKeyErrorProps {
    open?: boolean
    /** In anteprima locale il pulsante ricarica rivede entrata e uscita. */
    preview?: boolean
    onClose?: () => void
}

const enterEase = [0.16, 1, 0.3, 1] as const

function panelVariants(reduce: boolean): Variants {
    const center = { x: '-50%', y: '-50%' }
    if (reduce) {
        return {
            hidden: { opacity: 0, ...center },
            show: { opacity: 1, ...center, transition: { duration: 0.15, ease: 'easeOut' } },
            exit: { opacity: 0, ...center, transition: { duration: 0.12, ease: 'easeOut' } },
        }
    }

    return {
        hidden: { opacity: 0, x: '-50%', y: 'calc(-50% + 18px)', scale: 0.97 },
        show: {
            opacity: 1,
            x: '-50%',
            y: '-50%',
            scale: 1,
            transition: {
                type: 'spring',
                stiffness: 420,
                damping: 34,
                mass: 0.75,
                staggerChildren: 0.045,
                delayChildren: 0.05,
            },
        },
        exit: {
            opacity: 0,
            x: '-50%',
            y: 'calc(-50% + 10px)',
            scale: 0.98,
            transition: { duration: 0.16, ease: sheetEase },
        },
    }
}

function lineVariants(reduce: boolean): Variants {
    if (reduce) {
        return {
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { duration: 0.12 } },
        }
    }

    return {
        hidden: { opacity: 0, y: 8 },
        show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: enterEase } },
    }
}

export function ApiKeyError({ open = true, preview = false, onClose }: ApiKeyErrorProps) {
    const reduceMotion = useReducedMotion()
    const [visible, setVisible] = useState(open)
    const [portalReady, setPortalReady] = useState(false)
    const reloadRef = useRef<HTMLButtonElement>(null)
    const pending = useRef<'reload' | 'close' | null>(null)

    useEffect(() => {
        setPortalReady(true)
    }, [])

    useEffect(() => {
        setVisible(open)
    }, [open])

    useEffect(() => {
        if (!visible) return
        const previous = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        const frame = window.requestAnimationFrame(() => reloadRef.current?.focus())
        return () => {
            document.body.style.overflow = previous
            window.cancelAnimationFrame(frame)
        }
    }, [visible])

    const panel = panelVariants(reduceMotion)
    const line = lineVariants(reduceMotion)
    const backdropTransition: Transition = reduceMotion
        ? { duration: 0.12 }
        : { duration: 0.2, ease: dockEase }

    function requestReload() {
        pending.current = 'reload'
        setVisible(false)
    }

    function requestClose() {
        pending.current = 'close'
        setVisible(false)
    }

    function handleExitComplete() {
        const action = pending.current
        pending.current = null
        if (action === 'reload') {
            if (preview) {
                setVisible(true)
                return
            }
            window.location.reload()
        }
        if (action === 'close') onClose?.()
    }

    if (!portalReady) return null

    return createPortal(
        <AnimatePresence onExitComplete={handleExitComplete}>
            {visible && (
                <motion.div
                    key="tmdb-error-backdrop"
                    className="fixed inset-0 z-[70] bg-black/65 backdrop-blur-md"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={backdropTransition}
                    aria-hidden
                />
            )}
            {visible && (
                    <motion.div
                        key="tmdb-error-panel"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="tmdb-error-title"
                        variants={panel}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        className="fixed left-1/2 top-1/2 z-[71] w-[min(92vw,28rem)] overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 px-6 pb-6 pt-7 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:px-7"
                    >
                        <div
                            aria-hidden
                            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
                        />

                        {preview && onClose && (
                            <button
                                type="button"
                                onClick={requestClose}
                                className="absolute right-3 top-3 rounded-md px-2 py-1 text-[12px] text-white/35 transition-colors hover:bg-white/[0.06] hover:text-white"
                            >
                                Chiudi
                            </button>
                        )}

                        <motion.p variants={line} className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/40">
                            TMDB
                        </motion.p>
                        <motion.h2
                            id="tmdb-error-title"
                            variants={line}
                            className="mt-3 text-[1.75rem] font-semibold leading-[1.1] tracking-tight text-white sm:text-4xl"
                        >
                            Catalogo in pausa
                        </motion.h2>
                        <motion.p variants={line} className="mt-3 text-[15px] leading-relaxed text-white/60">
                            Senza la chiave TMDB i titoli non arrivano.
                        </motion.p>

                        <motion.ol variants={line} className="mt-6 space-y-3">
                            {STEPS.map((step, index) => (
                                <li key={step} className="flex gap-3 text-[13px] leading-snug text-white/55">
                                    <span className="w-5 shrink-0 font-mono text-[11px] tabular-nums text-white/30">
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <span>{step}</span>
                                </li>
                            ))}
                        </motion.ol>

                        <motion.div
                            variants={line}
                            className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3"
                        >
                            <p className="text-[11px] uppercase tracking-[0.16em] text-white/35">.env.local</p>
                            <p className="mt-2 font-mono text-[13px] tracking-wide">
                                <span className="text-white/80">TMDB_API_KEY=</span>
                                <span className="text-white/25">la_tua_chiave</span>
                            </p>
                        </motion.div>

                        <motion.div variants={line} className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <a
                                href={TMDB_API_SETTINGS}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-ghost-outline inline-flex h-11 items-center justify-center gap-2 px-5 text-sm"
                            >
                                Apri TMDB
                                <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                            <button
                                ref={reloadRef}
                                type="button"
                                onClick={requestReload}
                                className="btn-play inline-flex h-11 items-center justify-center px-6 text-sm"
                            >
                                Ricarica
                            </button>
                        </motion.div>
                    </motion.div>
            )}
        </AnimatePresence>,
        document.body
    )
}
