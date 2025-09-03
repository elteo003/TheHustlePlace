'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play } from 'lucide-react'
import { Movie } from '@/types'
import { getImageUrl } from '@/lib/utils'

interface Top10MovieCardProps {
    movie: Movie
    rank: number
}

export function Top10MovieCard({ movie, rank }: Top10MovieCardProps) {
    const [imageError, setImageError] = useState(false)

    const handlePlay = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        window.location.href = `/player/movie/${movie.id}`
    }

    return (
        <Card className="bg-transparent border-0 p-0 group cursor-pointer relative">
            <div className="relative aspect-[2/3] overflow-hidden rounded-lg">
                {/* Poster Image */}
                <Image
                    src={imageError ? '/placeholder-movie.svg' : getImageUrl(movie.poster_path, 'w500')}
                    alt={movie.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                    onError={() => setImageError(true)}
                    priority={false}
                    unoptimized={true}
                />

                {/* Rank Number - Stile Netflix */}
                <div className="absolute top-0 left-0 w-16 h-20 bg-gradient-to-br from-gray-800/90 to-gray-900/90 flex items-center justify-center z-10">
                    <span className="text-white font-bold text-2xl drop-shadow-lg">
                        {rank}
                    </span>
                </div>

                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 opacity-0 group-hover:opacity-100 bg-black/20">
                    <Button
                        size="lg"
                        className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30"
                        onClick={handlePlay}
                    >
                        <Play className="w-6 h-6" />
                    </Button>
                </div>

                {/* Gradient Overlay Bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/80 to-transparent"></div>
            </div>

            {/* Title below card */}
            <div className="mt-2">
                <h3 className="text-white font-medium text-sm line-clamp-2">
                    {movie.title}
                </h3>
                <div className="flex items-center justify-between mt-1">
                    <span className="text-gray-400 text-xs">
                        {new Date(movie.release_date).getFullYear()}
                    </span>
                    <div className="flex items-center space-x-1">
                        <span className="text-yellow-400 text-xs">★</span>
                        <span className="text-gray-400 text-xs">
                            {movie.vote_average.toFixed(1)}
                        </span>
                    </div>
                </div>
            </div>
        </Card>
    )
}
