import { TvDetail } from '@/tv/components/TvDetail'

export default async function LivingSeriesPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return <TvDetail id={Number(id)} type="tv" />
}
