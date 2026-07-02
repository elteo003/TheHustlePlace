import { fetchCatalogSection } from '@/lib/server/catalog'
import { TVPageClient } from '@/components/pages/tv-page-client'
import { TVShow } from '@/types'

export const dynamic = 'force-dynamic'

export default async function TVPage() {
    const [popular, recent, topRated] = await Promise.all([
        fetchCatalogSection('tv', 'popular', 10),
        fetchCatalogSection('tv', 'recent', 10),
        fetchCatalogSection('tv', 'top-rated', 10),
    ])

    return (
        <TVPageClient
            popular={popular as TVShow[]}
            recent={recent as TVShow[]}
            topRated={topRated as TVShow[]}
        />
    )
}
