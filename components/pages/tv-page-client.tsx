'use client'

import MovieGridIntegrated from '@/components/movie-grid-integrated'
import { UpcomingTVSection } from '@/components/upcoming-tv-section'
import { useContentNavigation } from '@/hooks/useContentNavigation'
import { TVShow } from '@/types'
import { UpcomingTVShowItem } from '@/lib/tv-upcoming'

interface TVPageClientProps {
    popular: TVShow[]
    recent: TVShow[]
    topRated: TVShow[]
    upcoming?: UpcomingTVShowItem[]
}

export function TVPageClient({ popular, recent, topRated, upcoming }: TVPageClientProps) {
    const { play, openDetails } = useContentNavigation()

    return (
        <div className="w-full bg-black">
            <main className="pt-8 pb-10">
                <div className="content-gutter space-y-12">
                    <h1 className="text-3xl font-bold text-white">Serie TV</h1>

                    {upcoming && upcoming.length > 0 && (
                        <div>
                            <UpcomingTVSection
                                items={upcoming}
                                onPlay={play}
                                onDetails={(id, type) => openDetails(id, type)}
                            />
                        </div>
                    )}

                    <div>
                        <h2 className="text-2xl font-bold text-white mb-6">Serie TV Popolari</h2>
                        <MovieGridIntegrated
                            type="tv"
                            section="popular"
                            onPlay={play}
                            onDetails={openDetails}
                            limit={24}
                            initialData={popular}
                        />
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-white mb-6">Serie TV Recenti</h2>
                        <MovieGridIntegrated
                            type="tv"
                            section="recent"
                            onPlay={play}
                            onDetails={openDetails}
                            limit={24}
                            initialData={recent}
                        />
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-white mb-6">Serie TV Migliori</h2>
                        <MovieGridIntegrated
                            type="tv"
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
