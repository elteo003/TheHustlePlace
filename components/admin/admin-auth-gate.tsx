'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Lock } from 'lucide-react'
import { MASTER_ADMIN_CODE_FORMATTED } from '@/lib/admin-auth'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface AdminAuthGateProps {
    onAuthenticated: () => void
}

export function AdminAuthGate({ onAuthenticated }: AdminAuthGateProps) {
    const shouldReduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
    const [code, setCode] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [shake, setShake] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    const handleInput = (val: string) => {
        setError(null)
        const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
        setCode(clean)

        if (clean.length === 8) {
            submitCode(clean)
        }
    }

    const submitCode = async (codeToSubmit: string) => {
        if (isSubmitting) return
        setIsSubmitting(true)
        setError(null)

        try {
            const res = await fetch('/api/admin/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: codeToSubmit }),
            })
            const data = await res.json()

            if (data.ok) {
                onAuthenticated()
            } else {
                setError(data.error || 'Codice di sicurezza non autorizzato')
                setShake((s) => s + 1)
            }
        } catch {
            setError('Impossibile verificare il codice. Riprova.')
            setShake((s) => s + 1)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        submitCode(code)
    }

    const slots = Array.from({ length: 8 }).map((_, i) => code[i] || '')

    return (
        <div className="min-h-screen bg-[#090a0f] text-zinc-100 flex flex-col items-center justify-center p-4 sm:p-6 select-none relative">
            <motion.div
                key={shake}
                animate={shake > 0 ? (shouldReduceMotion ? { opacity: [1, 0.5, 1] } : { x: [-8, 8, -6, 6, -3, 3, 0] }) : {}}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="w-full max-w-md bg-[#11131a] rounded-2xl p-7 sm:p-9 shadow-2xl border border-white/[0.08]"
            >
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-zinc-300">
                        <Lock className="w-4 h-4" />
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold text-white tracking-tight">
                            Accesso diagnostica ML
                        </h1>
                        <p className="text-xs text-zinc-400 mt-0.5">
                            Pannello di controllo raccomandazioni
                        </p>
                    </div>
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                    Inserisci il codice di sicurezza a 8 caratteri del dispositivo autorizzato per accedere alle metriche di ranking e all&apos;analisi degli errori.
                </p>

                {/* Form */}
                <form onSubmit={handleFormSubmit} className="space-y-5">
                    {/* Segmented character slots */}
                    <div
                        onClick={() => inputRef.current?.focus()}
                        className="cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 py-2"
                    >
                        {/* First 4 slots */}
                        <div className="flex gap-1.5 sm:gap-2">
                            {slots.slice(0, 4).map((char, idx) => {
                                const isCurrent = idx === code.length
                                return (
                                    <div
                                        key={`slot-${idx}`}
                                        className={`w-9 sm:w-11 h-12 sm:h-13 rounded-lg border flex items-center justify-center font-mono text-base sm:text-lg font-semibold transition-colors ${
                                            char
                                                ? 'border-white/30 bg-white/[0.08] text-white'
                                                : isCurrent
                                                ? 'border-zinc-300 bg-white/[0.04] text-white ring-1 ring-white/20'
                                                : 'border-white/[0.06] bg-black/30 text-zinc-600'
                                        }`}
                                    >
                                        {char || ''}
                                    </div>
                                )
                            })}
                        </div>

                        {/* Divider */}
                        <span className="text-zinc-600 font-mono text-sm px-0.5">-</span>

                        {/* Last 4 slots */}
                        <div className="flex gap-1.5 sm:gap-2">
                            {slots.slice(4, 8).map((char, idx) => {
                                const realIdx = idx + 4
                                const isCurrent = realIdx === code.length
                                return (
                                    <div
                                        key={`slot-${realIdx}`}
                                        className={`w-9 sm:w-11 h-12 sm:h-13 rounded-lg border flex items-center justify-center font-mono text-base sm:text-lg font-semibold transition-colors ${
                                            char
                                                ? 'border-white/30 bg-white/[0.08] text-white'
                                                : isCurrent
                                                ? 'border-zinc-300 bg-white/[0.04] text-white ring-1 ring-white/20'
                                                : 'border-white/[0.06] bg-black/30 text-zinc-600'
                                        }`}
                                    >
                                        {char || ''}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Hidden input */}
                    <input
                        ref={inputRef}
                        type="text"
                        value={code}
                        onChange={(e) => handleInput(e.target.value)}
                        maxLength={8}
                        autoComplete="off"
                        spellCheck="false"
                        className="opacity-0 absolute -z-10 pointer-events-none"
                    />

                    {/* Error message */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                className="py-2 px-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center font-medium"
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Submit button */}
                    <button
                        type="submit"
                        disabled={code.length !== 8 || isSubmitting}
                        className="w-full h-11 rounded-xl bg-white text-zinc-950 font-medium text-sm hover:bg-zinc-200 active:scale-[0.99] transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <span>Verifica in corso...</span>
                        ) : (
                            <>
                                <span>Verifica e accedi</span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>

                {/* Helper info */}
                <div className="mt-7 pt-5 border-t border-white/[0.06] text-center">
                    <p className="text-[11px] text-zinc-500">
                        Codice autorizzato per questo terminale:{' '}
                        <span className="font-mono text-zinc-300 font-medium">
                            {MASTER_ADMIN_CODE_FORMATTED}
                        </span>
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
