'use client'

import { useRef, useState } from 'react'
import { MovieCard } from './movie-card'
import { Movie, TVShow } from '@/types'
import { CustomScrollbar } from './custom-scrollbar'

interface ContentCarouselProps {
    title: string
    items: (Movie | TVShow)[]
    type: 'movie' | 'tv'
    showDetails?: boolean
}

export function ContentCarousel({ title, items, type, showDetails = false }: ContentCarouselProps) {

    if (!items || items.length === 0) {
        return null
    }

    return (
        <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">{title}</h2>
            </div>

            <CustomScrollbar className="pb-4" containerClassName="flex space-x-4">
                {items.map((item, index) => (
                    <div key={item.id} className="flex-shrink-0 w-48">
                        <MovieCard
                            movie={item as any}
                            rank={index + 1}
                            showRank={false}
                        />
                    </div>
                ))}
            </CustomScrollbar>
        </section>
    )
}
