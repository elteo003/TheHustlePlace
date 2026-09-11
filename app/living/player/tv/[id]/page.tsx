import { TvPlayer } from '@/tv/components/TvPlayer'

export default async function LivingTvPlayerPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return <TvPlayer id={Number(id)} type="tv" />
}
