import { fetchCatalogMoviesPage, fetchCatalogTVPage } from '@/lib/server/catalog'
import { CatalogPageClient } from '@/components/pages/catalog-page-client'

export const dynamic = 'force-dynamic'

export default async function CatalogPage() {
    const [moviesPage, tvPage] = await Promise.all([
        fetchCatalogMoviesPage(1),
        fetchCatalogTVPage(1),
    ])

    return (
        <CatalogPageClient
            initialMovies={moviesPage.results}
            initialMoviesPage={moviesPage.page}
            initialMoviesTotalPages={moviesPage.total_pages}
            initialTVShows={tvPage.results}
            initialTVPage={tvPage.page}
            initialTVTotalPages={tvPage.total_pages}
        />
    )
}
