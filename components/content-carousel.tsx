'use client'

import { useRef, useState } from 'react'
import { MovieCard } from './movie-card'
import { Movie, TVShow } from '@/types'

interface ContentCarouselProps {
    title: string
    items: (Movie | TVShow)[]
    type: 'movie' | 'tv'
    showDetails?: boolean
}

export function ContentCarousel({ title, items, type, showDetails = false }: ContentCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(true)

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollRef.current) return

        const scrollAmount = 300
        const currentScroll = scrollRef.current.scrollLeft
        const targetScroll = direction === 'left'
            ? currentScroll - scrollAmount
            : currentScroll + scrollAmount

        scrollRef.current.scrollTo({
            left: targetScroll,
            behavior: 'smooth'
        })

        // Update scroll state after animation
        setTimeout(() => {
            if (scrollRef.current) {
                setCanScrollLeft(scrollRef.current.scrollLeft > 0)
                setCanScrollRight(
                    scrollRef.current.scrollLeft <
                    scrollRef.current.scrollWidth - scrollRef.current.clientWidth
                )
            }
        }, 300)
    }

    const handleScroll = () => {
        if (!scrollRef.current) return

        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
        setCanScrollLeft(scrollLeft > 0)
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth)
    }

    if (!items || items.length === 0) {
        return null
    }

    return (
        <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">{title}</h2>
            </div>

            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex space-x-4 overflow-x-auto scrollbar-thin pb-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {items.map((item, index) => (
                    <div key={item.id} className="flex-shrink-0 w-48">
                        <MovieCard
                            movie={item as any}
                            rank={index + 1}
                            showRank={false}
                        />
                    </div>
                ))}
            </div>
        </section>
    )
}
