'use client'

import { useState } from 'react'
import { RankerWeights, RANKER_WEIGHTS_V1 } from '@/lib/taste-ranker'
import { RotateCcw } from 'lucide-react'

interface HyperparameterSandboxProps {
    weights: RankerWeights
    onApplyWeights: (weights: RankerWeights) => void
}

export function HyperparameterSandbox({ weights, onApplyWeights }: HyperparameterSandboxProps) {
    const [local, setLocal] = useState<RankerWeights>(weights)
    const [isModified, setIsModified] = useState(false)

    const handleChange = (key: keyof RankerWeights, val: number) => {
        const next = { ...local, [key]: Number(val.toFixed(2)) }
        setLocal(next)
        setIsModified(true)
    }

    const handleReset = () => {
        setLocal(RANKER_WEIGHTS_V1)
        onApplyWeights(RANKER_WEIGHTS_V1)
        setIsModified(false)
    }

    const handleSimulate = () => {
        onApplyWeights(local)
        setIsModified(false)
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
        <div className="bg-[#11131a] border border-white/[0.08] rounded-2xl p-5 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 border-b border-white/[0.06] pb-4">
                <div>
                    <h2 className="text-base font-semibold text-white">
                        Sandbox degli iperparametri del ranker
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                        Modifica in tempo reale i pesi della funzione obiettivo per simulare l&apos;impatto su ranking e recall
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleReset}
                        className="h-8 px-3 text-xs font-medium flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-all"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Ripristina
                    </button>

                    <button
                        type="button"
                        onClick={handleSimulate}
                        disabled={!isModified}
                        className="h-8 px-4 text-xs font-semibold rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
                    >
                        Applica simulazione
                    </button>
                </div>
            </div>

            {/* Sliders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sliders.map((s) => {
                    const val = Number((local[s.key] as number) ?? 0)

                    return (
                        <div
                            key={s.key}
                            className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2.5"
                        >
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-white">{s.label}</span>
                                <span className="font-mono font-semibold text-white bg-white/[0.06] px-2 py-0.5 rounded tabular-nums">
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
                                className="w-full accent-white cursor-pointer h-1.5 bg-white/10 rounded-lg"
                            />

                            <p className="text-[11px] text-zinc-500 leading-relaxed">{s.desc}</p>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
