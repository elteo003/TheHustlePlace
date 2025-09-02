'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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

                <div className="flex items-center space-x-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/10 disabled:opacity-50"
                        onClick={() => scroll('left')}
                        disabled={!canScrollLeft}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/10 disabled:opacity-50"
                        onClick={() => scroll('right')}
                        disabled={!canScrollRight}
                    >
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex space-x-4 overflow-x-auto scrollbar-thin pb-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {items.map((item) => (
                    <div key={item.id} className="flex-shrink-0 w-48">
                        <MovieCard
                            item={item}
                            type={type}
                            showDetails={showDetails}
                        />
                    </div>
                ))}
            </div>
        </section>
    )
}
