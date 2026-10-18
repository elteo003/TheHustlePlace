'use client'

import { useState } from 'react'
import { MetricAtK } from '@/lib/admin-ml-metrics'

interface RankingQualityChartProps {
    metricsAtK: MetricAtK[]
    mrr: number
    map: number
    ild: number
}

export function RankingQualityChart({ metricsAtK, mrr, map, ild }: RankingQualityChartProps) {
    const [hoveredK, setHoveredK] = useState<number | null>(null)

    // Chart dimensions
    const width = 640
    const height = 260
    const padding = { top: 25, right: 30, bottom: 40, left: 45 }

    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    const getX = (k: number) => padding.left + ((k - 1) / (20 - 1)) * chartWidth
    const getY = (val: number) => padding.top + (1 - val) * chartHeight

    const ndcgPath = metricsAtK
        .map((m, i) => `${i === 0 ? 'M' : 'L'} ${getX(m.k)} ${getY(m.ndcg)}`)
        .join(' ')

    const precisionPath = metricsAtK
        .map((m, i) => `${i === 0 ? 'M' : 'L'} ${getX(m.k)} ${getY(m.precision)}`)
        .join(' ')

    const recallPath = metricsAtK
        .map((m, i) => `${i === 0 ? 'M' : 'L'} ${getX(m.k)} ${getY(m.recall)}`)
        .join(' ')

    const activeMetric = hoveredK ? metricsAtK.find((m) => m.k === hoveredK) : metricsAtK[4] // default to K=5

    return (
        <div className="space-y-6">
            {/* Header - Borderless */}
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-3 border-b border-white/[0.08]">
                <div>
                    <h2 className="text-base font-semibold text-white tracking-tight">
                        Curve di qualità del ranking (NDCG, Precision, Recall)
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                        Valutazione dell&apos;ordinamento posizionale con K da 1 a 20
                    </p>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-4 font-mono text-xs">
                    <div>
                        <span className="text-zinc-500 text-[10px] block">MRR</span>
                        <span className="font-bold text-white text-base">{mrr}</span>
                    </div>
                    <div>
                        <span className="text-zinc-500 text-[10px] block">MAP</span>
                        <span className="font-bold text-cyan-400 text-base">{map}</span>
                    </div>
                    <div>
                        <span className="text-zinc-500 text-[10px] block">ILD (Diversità)</span>
                        <span className="font-bold text-amber-400 text-base">{ild}</span>
                    </div>
                </div>
            </div>

            {/* Interactive Legend & Active Values */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-2 text-xs">
                <div className="flex items-center gap-5">
                    <div className="flex items-center gap-2">
                        <div className="w-3.5 h-1 bg-emerald-400 rounded-full" />
                        <span className="text-zinc-300 font-medium">NDCG@K</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3.5 h-1 bg-cyan-400 rounded-full" />
                        <span className="text-zinc-300 font-medium">Precision@K</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3.5 h-1 bg-amber-400 rounded-full" />
                        <span className="text-zinc-300 font-medium">Recall@K</span>
                    </div>
                </div>

                {activeMetric && (
                    <div className="flex items-center gap-4 font-mono text-xs">
                        <span className="text-zinc-500">K = {activeMetric.k}:</span>
                        <span className="text-emerald-400 font-semibold">NDCG {activeMetric.ndcg}</span>
                        <span className="text-cyan-400 font-semibold">P@{activeMetric.k} {activeMetric.precision}</span>
                        <span className="text-amber-400 font-semibold">R@{activeMetric.k} {activeMetric.recall}</span>
                    </div>
                )}
            </div>

            {/* SVG Chart */}
            <div className="relative w-full overflow-x-auto [scrollbar-width:none]">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="w-full h-auto min-w-[500px] overflow-visible"
                >
                    {/* Y-axis grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1.0].map((val) => {
                        const y = getY(val)
                        return (
                            <g key={`y-grid-${val}`}>
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
                                    {val.toFixed(2)}
                                </text>
                            </g>
                        )
                    })}

                    {/* X-axis ticks */}
                    {[1, 3, 5, 8, 10, 15, 20].map((k) => {
                        const x = getX(k)
                        return (
                            <g key={`x-tick-${k}`}>
                                <line
                                    x1={x}
                                    y1={height - padding.bottom}
                                    x2={x}
                                    y2={height - padding.bottom + 4}
                                    stroke="rgba(255,255,255,0.2)"
                                />
                                <text
                                    x={x}
                                    y={height - padding.bottom + 16}
                                    textAnchor="middle"
                                    className="text-[9px] fill-zinc-500 font-mono"
                                >
                                    K={k}
                                </text>
                            </g>
                        )
                    })}

                    {/* Recall Path (Amber) */}
                    <path
                        d={recallPath}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2"
                        strokeDasharray="4 3"
                    />

                    {/* Precision Path (Cyan) */}
                    <path
                        d={precisionPath}
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="2"
                    />

                    {/* NDCG Path (Emerald) */}
                    <path
                        d={ndcgPath}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.5"
                    />

                    {/* Interactive hover points */}
                    {metricsAtK.map((m) => {
                        const x = getX(m.k)
                        const isHovered = activeMetric?.k === m.k

                        return (
                            <g
                                key={`point-${m.k}`}
                                onMouseEnter={() => setHoveredK(m.k)}
                                className="cursor-pointer"
                            >
                                {/* Vertical guideline when active */}
                                {isHovered && (
                                    <line
                                        x1={x}
                                        y1={padding.top}
                                        x2={x}
                                        y2={height - padding.bottom}
                                        stroke="rgba(255,255,255,0.25)"
                                        strokeDasharray="2 2"
                                    />
                                )}

                                {/* NDCG Dot (Emerald) */}
                                <circle
                                    cx={x}
                                    cy={getY(m.ndcg)}
                                    r={isHovered ? 4.5 : 3}
                                    fill="#10b981"
                                />

                                {/* Precision Dot (Cyan) */}
                                <circle
                                    cx={x}
                                    cy={getY(m.precision)}
                                    r={isHovered ? 4 : 2.5}
                                    fill="#06b6d4"
                                />

                                {/* Hover trigger column */}
                                <rect
                                    x={x - 12}
                                    y={padding.top}
                                    width={24}
                                    height={chartHeight}
                                    fill="transparent"
                                />
                            </g>
                        )
                    })}
                </svg>
            </div>
        </div>
    )
}
