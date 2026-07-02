import { fetchCatalogSection } from '@/lib/server/catalog'
import { MoviesPageClient } from '@/components/pages/movies-page-client'
import { Movie } from '@/types'

export const dynamic = 'force-dynamic'

export default async function MoviesPage() {
    const [popular, recent, topRated] = await Promise.all([
        fetchCatalogSection('movie', 'popular', 10),
        fetchCatalogSection('movie', 'recent', 10),
        fetchCatalogSection('movie', 'top-rated', 10),
    ])

    return (
        <MoviesPageClient
            popular={popular as Movie[]}
            recent={recent as Movie[]}
            topRated={topRated as Movie[]}
        />
    )
}
