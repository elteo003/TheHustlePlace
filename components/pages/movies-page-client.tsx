'use client'

import MovieGridIntegrated from '@/components/movie-grid-integrated'
import { useContentNavigation } from '@/hooks/useContentNavigation'
import { Movie } from '@/types'

interface MoviesPageClientProps {
    popular: Movie[]
    recent: Movie[]
    topRated: Movie[]
}

export function MoviesPageClient({ popular, recent, topRated }: MoviesPageClientProps) {
    const { play, openDetails } = useContentNavigation()

    return (
        <div className="w-full bg-black">
            <main className="pt-8 pb-10">
                <div className="content-gutter space-y-12">
                    <h1 className="text-3xl font-bold text-white">Film</h1>

                    <div>
                        <h2 className="text-2xl font-bold text-white mb-6">Film Popolari</h2>
                        <MovieGridIntegrated
                            type="movie"
                            section="popular"
                            onPlay={play}
                            onDetails={openDetails}
                            limit={24}
                            initialData={popular}
                        />
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-white mb-6">Film Recenti</h2>
                        <MovieGridIntegrated
                            type="movie"
                            section="recent"
                            onPlay={play}
                            onDetails={openDetails}
                            limit={24}
                            initialData={recent}
                        />
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-white mb-6">Film Migliori</h2>
                        <MovieGridIntegrated
                            type="movie"
                            section="top-rated"
                            onPlay={play}
                            onDetails={openDetails}
                            limit={24}
                            initialData={topRated}
                        />
                    </div>
                </div>
            </main>
        </div>
    )
}
