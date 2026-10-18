'use client'

import { LorenzPoint } from '@/lib/admin-ml-metrics'

interface LorenzGiniChartProps {
    points: LorenzPoint[]
    gini: number
}

export function LorenzGiniChart({ points, gini }: LorenzGiniChartProps) {
    const width = 500
    const height = 240
    const padding = { top: 20, right: 25, bottom: 35, left: 45 }

    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    const getX = (pct: number) => padding.left + (pct / 100) * chartWidth
    const getY = (pct: number) => padding.top + (1 - pct / 100) * chartHeight

    // 45-degree ideal path
    const idealPath = `M ${getX(0)} ${getY(0)} L ${getX(100)} ${getY(100)}`

    // Actual Lorenz curve path
    const lorenzPath = points
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.catalogPercentile)} ${getY(p.impressionShare)}`)
        .join(' ')

    // Closed path for shading Gini area
    const giniAreaPath = `${lorenzPath} L ${getX(100)} ${getY(100)} L ${getX(0)} ${getY(0)} Z`

    return (
        <div className="space-y-6 pt-6 border-t border-white/[0.08]">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 pb-3 border-b border-white/[0.08]">
                <div>
                    <h2 className="text-base font-semibold text-white tracking-tight">
                        Curva di Lorenz ed esposizione del catalogo (Indice di Gini)
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                        Verifica della distribuzione delle raccomandazioni per prevenire il popularity bias
                    </p>
                </div>

                <div className="font-mono text-xs flex items-center gap-2 shrink-0">
                    <span className="text-zinc-500">Gini:</span>
                    <span className="font-bold text-cyan-400 text-lg">{gini}</span>
                    <span className="text-emerald-400 text-xs font-sans">(bilanciato)</span>
                </div>
            </div>

            {/* SVG Chart */}
            <div className="relative w-full overflow-x-auto [scrollbar-width:none]">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="w-full h-auto min-w-[420px] overflow-visible"
                >
                    {/* Grid */}
                    {[0, 25, 50, 75, 100].map((val) => {
                        const y = getY(val)
                        return (
                            <g key={`y-lorenz-${val}`}>
                                <line
                                    x1={padding.left}
                                    y1={y}
                                    x2={width - padding.right}
                                    y2={y}
                                    stroke="rgba(255,255,255,0.06)"
                                    strokeDasharray="2 2"
                                />
                                <text
                                    x={padding.left - 8}
                                    y={y + 3}
                                    textAnchor="end"
                                    className="text-[9px] fill-zinc-500 font-mono"
                                >
                                    {val}%
                                </text>
                            </g>
                        )
                    })}

                    {/* X-axis */}
                    {[0, 25, 50, 75, 100].map((val) => {
                        const x = getX(val)
                        return (
                            <g key={`x-lorenz-${val}`}>
                                <text
                                    x={x}
                                    y={height - padding.bottom + 15}
                                    textAnchor="middle"
                                    className="text-[9px] fill-zinc-500 font-mono"
                                >
                                    {val}%
                                </text>
                            </g>
                        )
                    })}

                    {/* Shaded Gini Area */}
                    <path
                        d={giniAreaPath}
                        fill="rgba(6, 182, 212, 0.08)"
                    />

                    {/* 45 degree perfect equality line */}
                    <path
                        d={idealPath}
                        fill="none"
                        stroke="#71717a"
                        strokeWidth="1.5"
                        strokeDasharray="4 3"
                    />

                    {/* Empirical Lorenz curve in Cyan */}
                    <path
                        d={lorenzPath}
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="2.5"
                    />

                    {/* Points on Lorenz curve */}
                    {points.map((p) => (
                        <circle
                            key={`pt-${p.catalogPercentile}`}
                            cx={getX(p.catalogPercentile)}
                            cy={getY(p.impressionShare)}
                            r={3}
                            fill="#06b6d4"
                        />
                    ))}
                </svg>
            </div>

            <div className="flex flex-wrap items-center justify-between text-xs text-zinc-400 pt-2 border-t border-white/[0.04]">
                <div className="flex items-center gap-5">
                    <div className="flex items-center gap-2">
                        <div className="w-3.5 h-1 bg-zinc-500 rounded-full" />
                        <span>Distribuzione uniforme ideale</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3.5 h-1 bg-cyan-400 rounded-full" />
                        <span className="text-white">Curva reale catalogo</span>
                    </div>
                </div>
                <div className="text-[11px] text-zinc-500">
                    Un indice compreso tra 0.35 e 0.45 offre una scoperta ideale dei titoli di nicchia.
                </div>
            </div>
        </div>
    )
}
