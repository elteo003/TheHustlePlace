'use client'

import { useState } from 'react'
import { RankerWeights, RANKER_WEIGHTS_V1 } from '@/lib/taste-ranker'
import { RotateCcw, Play, Save, Check, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface HyperparameterSandboxProps {
    weights: RankerWeights
    onApplyWeights: (weights: RankerWeights) => Promise<void> | void
    onSaveToDatabase?: (weights: RankerWeights) => Promise<boolean>
    onScrollToChart?: () => void
}

export function HyperparameterSandbox({
    weights,
    onApplyWeights,
    onSaveToDatabase,
    onScrollToChart,
}: HyperparameterSandboxProps) {
    const [local, setLocal] = useState<RankerWeights>(weights)
    const [isModified, setIsModified] = useState(false)
    const [isSimulating, setIsSimulating] = useState(false)
    const [justApplied, setJustApplied] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isSaved, setIsSaved] = useState(false)

    const handleChange = (key: keyof RankerWeights, val: number) => {
        const next = { ...local, [key]: Number(val.toFixed(2)) }
        setLocal(next)
        setIsModified(true)
        setIsSaved(false)
        setJustApplied(false)
    }

    const handleReset = async () => {
        setLocal(RANKER_WEIGHTS_V1)
        setIsModified(false)
        setIsSaved(false)
        setJustApplied(false)
        setIsSimulating(true)
        try {
            await onApplyWeights(RANKER_WEIGHTS_V1)
            toast.info('Pesi di default ripristinati', {
                description: 'Le curve del ranker sono state reimpostate ai valori base v1.',
            })
            if (onScrollToChart) {
                setTimeout(onScrollToChart, 150)
            }
        } finally {
            setIsSimulating(false)
        }
    }

    const handleSimulate = async () => {
        setIsSimulating(true)
        try {
            await onApplyWeights(local)
            setIsModified(false)
            setJustApplied(true)
            toast.success('Simulazione applicata con successo', {
                description: 'Curve NDCG@K e metriche di ranking ricalcolate in tempo reale.',
            })
            if (onScrollToChart) {
                setTimeout(onScrollToChart, 150)
            }
            setTimeout(() => setJustApplied(false), 3000)
        } catch {
            toast.error('Errore durante la simulazione dei pesi')
        } finally {
            setIsSimulating(false)
        }
    }

    const handleSaveToDb = async () => {
        if (!onSaveToDatabase) return
        setIsSaving(true)
        try {
            const success = await onSaveToDatabase(local)
            if (success) {
                setIsSaved(true)
                setIsModified(false)
                toast.success('Pesi salvati in produzione', {
                    description: 'I nuovi pesi del ranker sono ora persistiti nel database PostgreSQL.',
                })
                setTimeout(() => setIsSaved(false), 3000)
            } else {
                toast.error('Impossibile salvare i pesi nel database')
            }
        } finally {
            setIsSaving(false)
        }
    }

    const sliders = [
        {
            key: 'simTaste' as const,
            label: 'w_simTaste - Affinità di genere',
            desc: 'Similarità vettoriale tra i generi guardati dall’utente e i candidati.',
            min: 0.05,
            max: 0.6,
            step: 0.01,
        },
        {
            key: 'explicit' as const,
            label: 'w_explicit - Feedback esplicito',
            desc: 'Boost per i titoli valutati positivamente e penalità per i dislike.',
            min: 0.1,
            max: 0.6,
            step: 0.01,
        },
        {
            key: 'popularity' as const,
            label: 'w_popularity - Popolarità globale TMDB',
            desc: 'Incidenza della popolarità generale: valori elevati penalizzano la nicchia.',
            min: 0.01,
            max: 0.3,
            step: 0.01,
        },
        {
            key: 'newness' as const,
            label: 'w_newness - Freschezza dell’uscita',
            desc: 'Incentiva i titoli usciti nel mese corrente rispetto a quelli di catalogo.',
            min: 0.02,
            max: 0.3,
            step: 0.01,
        },
        {
            key: 'neighbor' as const,
            label: 'w_neighbor - Grafo tematico delle keyword',
            desc: 'Propagazione della preferenza sui titoli con keyword condivise.',
            min: 0.02,
            max: 0.3,
            step: 0.01,
        },
        {
            key: 'abandon' as const,
            label: 'w_abandon - Penalità abbandono precoce',
            desc: 'Penalità inflitta ai titoli interrotti nei primi minuti di riproduzione.',
            min: 0.01,
            max: 0.3,
            step: 0.01,
        },
    ]

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 pb-3 border-b border-white/[0.08]">
                <div>
                    <h2 className="text-base font-semibold text-white tracking-tight">
                        Sandbox degli iperparametri del ranker
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                        Modifica in tempo reale i pesi della funzione obiettivo per simulare l&apos;impatto su ranking e recall
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        type="button"
                        onClick={handleReset}
                        disabled={isSimulating}
                        className="h-8 px-3 text-xs font-medium flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Ripristina
                    </button>

                    <button
                        type="button"
                        onClick={handleSimulate}
                        disabled={(!isModified && !justApplied) || isSimulating}
                        className="h-8 px-4 text-xs font-semibold rounded-lg bg-emerald-400 text-black hover:bg-emerald-300 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5 shadow-sm"
                    >
                        {isSimulating ? (
                            <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" />
                                <span>Simulazione in corso...</span>
                            </>
                        ) : justApplied ? (
                            <>
                                <Check className="w-3.5 h-3.5 text-black" />
                                <span>Simulazione applicata!</span>
                            </>
                        ) : (
                            <>
                                <Play className="w-3 h-3 fill-current" />
                                <span>Applica simulazione</span>
                            </>
                        )}
                    </button>

                    {onSaveToDatabase && (
                        <button
                            type="button"
                            onClick={handleSaveToDb}
                            disabled={isSaving}
                            className="h-8 px-3.5 text-xs font-semibold rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
                            title="Salva questi pesi nel database di produzione (tabella ranker_weights)"
                        >
                            {isSaving ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : isSaved ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                                <Save className="w-3.5 h-3.5" />
                            )}
                            <span>{isSaved ? 'Salvato!' : 'Salva in produzione'}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Sliders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                {sliders.map((s) => {
                    const val = Number((local[s.key] as number) ?? 0)

                    return (
                        <div
                            key={s.key}
                            className="p-4 rounded-xl bg-zinc-950/70 border border-white/[0.08] space-y-2.5 hover:border-white/20 transition-colors"
                        >
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-white">{s.label}</span>
                                <span className="font-mono font-bold text-white bg-white/10 border border-white/15 px-2 py-0.5 rounded tabular-nums">
                                    {val.toFixed(2)}
                                </span>
                            </div>

                            <input
                                type="range"
                                min={s.min}
                                max={s.max}
                                step={s.step}
                                value={val}
                                onChange={(e) => handleChange(s.key, parseFloat(e.target.value))}
                                className="w-full accent-white cursor-pointer h-1.5 bg-white/15 rounded-lg"
                            />

                            <p className="text-[11px] text-zinc-400 leading-relaxed">{s.desc}</p>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
