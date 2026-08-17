import { Suspense } from 'react'
import { fetchSearchResults } from '@/lib/server/catalog'
import { SearchPageClient } from '@/components/pages/search-page-client'
import { Spinner } from '@/components/ui/spinner'

export const dynamic = 'force-dynamic'

interface SearchPageProps {
    searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const { q = '' } = await searchParams
    const query = q.trim()

    const results = query
        ? await fetchSearchResults(query)
        : { movies: [], tvShows: [], totalMovies: 0, totalTVShows: 0 }

    return (
        <Suspense
            fallback={
                <main className="min-h-screen bg-black">
                    <div className="container mx-auto px-4 py-8">
                        <div className="flex items-center justify-center h-64">
                            <Spinner />
                        </div>
                    </div>
                </main>
            }
        >
            <SearchPageClient
                query={query}
                initialMovies={results.movies}
                initialTVShows={results.tvShows}
                initialTotalMovies={results.totalMovies}
                initialTotalTVShows={results.totalTVShows}
            />
        </Suspense>
    )
}
