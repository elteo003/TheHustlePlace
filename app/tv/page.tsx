import { fetchCatalogSection } from '@/lib/server/catalog'
import { HOME_RAIL_SIZE } from '@/lib/catalog-types'
import { TVPageClient } from '@/components/pages/tv-page-client'
import { TVShow } from '@/types'

export const dynamic = 'force-dynamic'

export default async function TVPage() {
    const [popular, recent, topRated] = await Promise.all([
        fetchCatalogSection('tv', 'popular', HOME_RAIL_SIZE),
        fetchCatalogSection('tv', 'recent', HOME_RAIL_SIZE),
        fetchCatalogSection('tv', 'top-rated', HOME_RAIL_SIZE),
    ])

    return (
        <TVPageClient
            popular={popular as TVShow[]}
            recent={recent as TVShow[]}
            topRated={topRated as TVShow[]}
        />
    )
}
