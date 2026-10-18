'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, ShieldAlert, KeyRound, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react'
import { MASTER_ADMIN_CODE_RAW, MASTER_ADMIN_CODE_FORMATTED } from '@/lib/admin-auth'

interface AdminAuthGateProps {
    onAuthenticated: () => void
}

export function AdminAuthGate({ onAuthenticated }: AdminAuthGateProps) {
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
        // Keep only alphanumeric uppercase
        const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
        setCode(clean)

        // Auto submit when 8 characters typed
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
                setError(data.error || 'Codice non autorizzato')
                setShake((s) => s + 1)
            }
        } catch {
            setError('Errore di connessione durante la verifica')
            setShake((s) => s + 1)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        submitCode(code)
    }

    // Split code for display in 8 individual boxes
    const slots = Array.from({ length: 8 }).map((_, i) => code[i] || '')

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
            {/* Ambient background glows */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-red-600/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-600/10 blur-[140px] rounded-full pointer-events-none" />

            <motion.div
                key={shake}
                animate={shake > 0 ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md bg-zinc-950/90 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.8)] relative z-10"
            >
                {/* Header Icon */}
                <div className="flex items-center justify-center mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/20 to-zinc-900 border border-red-500/30 flex items-center justify-center text-red-400 shadow-lg shadow-red-500/10">
                        <Lock className="w-7 h-7" />
                    </div>
                </div>

                {/* Title */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold uppercase tracking-wider text-white/70 mb-2">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                        Area Riservata Algoritmi ML
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        ML Evaluation Console
                    </h1>
                    <p className="text-xs sm:text-sm text-white/50 mt-1.5 leading-relaxed">
                        Inserisci il codice di sicurezza del dispositivo amministratore per accedere al pannello diagnostico.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleFormSubmit} className="space-y-6">
                    {/* Visual Segmented 8-character Slots */}
                    <div
                        onClick={() => inputRef.current?.focus()}
                        className="cursor-pointer group flex items-center justify-center gap-1.5 sm:gap-2"
                    >
                        {/* First 4 slots */}
                        <div className="flex gap-1 sm:gap-1.5">
                            {slots.slice(0, 4).map((char, idx) => (
                                <div
                                    key={`slot-${idx}`}
                                    className={`w-9 sm:w-11 h-12 sm:h-14 rounded-xl border flex items-center justify-center font-mono text-lg sm:text-xl font-bold transition-all ${
                                        char
                                            ? 'border-white/40 bg-white/10 text-white shadow-[0_0_12px_rgba(255,255,255,0.15)]'
                                            : idx === code.length
                                            ? 'border-red-500/60 bg-red-500/5 text-white animate-pulse ring-2 ring-red-500/20'
                                            : 'border-white/10 bg-zinc-900/60 text-white/30'
                                    }`}
                                >
                                    {char || '·'}
                                </div>
                            ))}
                        </div>

                        {/* Separator */}
                        <span className="text-white/30 font-bold text-lg px-0.5">-</span>

                        {/* Last 4 slots */}
                        <div className="flex gap-1 sm:gap-1.5">
                            {slots.slice(4, 8).map((char, idx) => {
                                const realIdx = idx + 4
                                return (
                                    <div
                                        key={`slot-${realIdx}`}
                                        className={`w-9 sm:w-11 h-12 sm:h-14 rounded-xl border flex items-center justify-center font-mono text-lg sm:text-xl font-bold transition-all ${
                                            char
                                                ? 'border-white/40 bg-white/10 text-white shadow-[0_0_12px_rgba(255,255,255,0.15)]'
                                                : realIdx === code.length
                                                ? 'border-red-500/60 bg-red-500/5 text-white animate-pulse ring-2 ring-red-500/20'
                                                : 'border-white/10 bg-zinc-900/60 text-white/30'
                                        }`}
                                    >
                                        {char || '·'}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Hidden Actual Input */}
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

                    {/* Error display */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs text-center font-medium"
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={code.length !== 8 || isSubmitting}
                        className="w-full h-11 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-lg shadow-white/10"
                    >
                        {isSubmitting ? (
                            <span>Verifica in corso...</span>
                        ) : (
                            <>
                                <span>Verifica Codice & Accedi</span>
                                <ChevronRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>

                {/* Helper info */}
                <div className="mt-6 pt-5 border-t border-white/5 flex flex-col items-center gap-2 text-center">
                    <p className="text-[11px] text-white/40">
                        Codice autorizzato visualizzato sul dispositivo principale:{' '}
                        <code className="text-white/70 font-mono font-bold bg-white/5 px-1.5 py-0.5 rounded">
                            {MASTER_ADMIN_CODE_FORMATTED}
                        </code>
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
