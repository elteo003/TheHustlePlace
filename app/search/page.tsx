import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { SearchPageClient } from '@/components/pages/search-page-client'
import { Spinner } from '@/components/ui/spinner'

export const dynamic = 'force-dynamic'

interface SearchPageProps {
    searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const { q = '' } = await searchParams
    if (!q.trim()) {
        redirect('/home')
    }

    return (
        <Suspense
            fallback={
                <main className="min-h-screen bg-black">
                    <div className="content-gutter py-8">
                        <div className="flex h-64 items-center justify-center">
                            <Spinner />
                        </div>
                    </div>
                </main>
            }
        >
            <SearchPageClient />
        </Suspense>
    )
}
