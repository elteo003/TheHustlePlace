'use client'

import { ContentType } from '@/lib/content-navigation'
import { TvRailItem } from '@/tv/lib/types'
import { TvPoster } from '@/tv/components/TvPoster'

interface TvRowProps {
    title: string
    items: TvRailItem[]
    type?: ContentType
    onSelect: (id: number, type: ContentType) => void
    onPeek?: (id: number, type: ContentType) => void
}

export function TvRow({ title, items, type, onSelect, onPeek }: TvRowProps) {
    if (items.length === 0) return null

    return (
        <section className="space-y-4">
            <h2 className="text-2xl font-medium text-white">{title}</h2>
            <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {items.map((item) => (
                    <TvPoster
                        key={`${type ?? 'mix'}-${item.id}`}
                        item={item}
                        type={type}
                        onSelect={onSelect}
                        onPeek={onPeek}
                    />
                ))}
            </div>
        </section>
    )
}
