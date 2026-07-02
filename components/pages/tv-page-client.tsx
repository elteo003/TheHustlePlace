'use client'

import MovieGridIntegrated from '@/components/movie-grid-integrated'
import { useContentNavigation } from '@/hooks/useContentNavigation'
import { TVShow } from '@/types'

interface TVPageClientProps {
    popular: TVShow[]
    recent: TVShow[]
    topRated: TVShow[]
}

export function TVPageClient({ popular, recent, topRated }: TVPageClientProps) {
    const { play, openDetails } = useContentNavigation()

    return (
        <div className="min-h-screen bg-black">
            <main className="pt-8 pb-16">
                <div className="max-w-7xl mx-auto px-4">
                    <h1 className="text-3xl font-bold text-white mb-8">Serie TV</h1>

                    <div className="mb-12">
                        <h2 className="text-2xl font-bold text-white mb-6">Serie TV Popolari</h2>
                        <MovieGridIntegrated
                            type="tv"
                            section="popular"
                            onPlay={play}
                            onDetails={openDetails}
                            limit={10}
                            initialData={popular}
                        />
                    </div>

                    <div className="mb-12">
                        <h2 className="text-2xl font-bold text-white mb-6">Serie TV Recenti</h2>
                        <MovieGridIntegrated
                            type="tv"
                            section="recent"
                            onPlay={play}
                            onDetails={openDetails}
                            limit={10}
                            initialData={recent}
                        />
                    </div>

                    <div className="mb-12">
                        <h2 className="text-2xl font-bold text-white mb-6">Serie TV Migliori</h2>
                        <MovieGridIntegrated
                            type="tv"
                            section="top-rated"
                            onPlay={play}
                            onDetails={openDetails}
                            limit={10}
                            initialData={topRated}
                        />
                    </div>
                </div>
            </main>
        </div>
    )
}
