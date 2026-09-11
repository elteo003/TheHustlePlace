import { TvPlayer } from '@/tv/components/TvPlayer'

export default async function LivingMoviePlayerPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return <TvPlayer id={Number(id)} type="movie" />
}
