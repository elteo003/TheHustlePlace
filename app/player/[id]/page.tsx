import { redirect } from 'next/navigation'

interface LegacyPlayerPageProps {
    params: Promise<{ id: string }>
}

export default async function LegacyPlayerPage({ params }: LegacyPlayerPageProps) {
    const { id } = await params
    redirect(`/player/movie/${id}`)
}
