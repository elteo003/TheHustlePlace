import { fetchCatalogSection } from '@/lib/server/catalog'
import { HOME_RAIL_SIZE } from '@/lib/catalog-types'
import { MoviesPageClient } from '@/components/pages/movies-page-client'
import { Movie } from '@/types'

export const dynamic = 'force-dynamic'

export default async function MoviesPage() {
    const [popular, recent, topRated] = await Promise.all([
        fetchCatalogSection('movie', 'popular', HOME_RAIL_SIZE),
        fetchCatalogSection('movie', 'recent', HOME_RAIL_SIZE),
        fetchCatalogSection('movie', 'top-rated', HOME_RAIL_SIZE),
    ])

    return (
        <MoviesPageClient
            popular={popular as Movie[]}
            recent={recent as Movie[]}
            topRated={topRated as Movie[]}
        />
    )
}
