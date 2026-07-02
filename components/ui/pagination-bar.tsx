'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationBarProps {
    page: number
    totalPages: number
    onPageChange: (page: number) => void
    loading?: boolean
}

export function PaginationBar({ page, totalPages, onPageChange, loading }: PaginationBarProps) {
    if (totalPages <= 1) return null

    const pages = buildPageList(page, totalPages)

    return (
        <nav
            className="flex items-center justify-center gap-1 mt-10"
            aria-label="Paginazione catalogo"
        >
            <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => onPageChange(page - 1)}
                className="p-2 rounded-md text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                aria-label="Pagina precedente"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>

            {pages.map((p, i) =>
                p === '…' ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-white/30 text-sm">
                        …
                    </span>
                ) : (
                    <button
                        key={p}
                        type="button"
                        disabled={loading}
                        onClick={() => onPageChange(p)}
                        className={cn(
                            'min-w-[2.25rem] h-9 px-2 rounded-md text-sm font-medium transition-colors',
                            p === page
                                ? 'bg-white text-black'
                                : 'text-white/60 hover:text-white hover:bg-white/10'
                        )}
                        aria-label={`Pagina ${p}`}
                        aria-current={p === page ? 'page' : undefined}
                    >
                        {p}
                    </button>
                )
            )}

            <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => onPageChange(page + 1)}
                className="p-2 rounded-md text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                aria-label="Pagina successiva"
            >
                <ChevronRight className="w-5 h-5" />
            </button>
        </nav>
    )
}

function buildPageList(current: number, total: number): (number | '…')[] {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1)
    }
    const pages: (number | '…')[] = [1]
    if (current > 3) pages.push('…')
    for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
        pages.push(p)
    }
    if (current < total - 2) pages.push('…')
    pages.push(total)
    return pages
}
