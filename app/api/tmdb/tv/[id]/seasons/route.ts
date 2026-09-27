import { NextRequest, NextResponse } from 'next/server'
import { tmdbWrapperService } from '@/services/tmdb-wrapper.service'
import { checkEpisodesAvailability } from '@/services/availability.service'

export const dynamic = 'force-dynamic'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const tvId = parseInt(id)

        if (isNaN(tvId)) {
            return NextResponse.json({
                success: false,
                error: 'ID serie TV non valido'
            }, { status: 400 })
        }

        console.log('📺 Recupero stagioni e episodi per serie TV ID:', tvId)

        const seasonsWithEpisodes = await tmdbWrapperService.getTVShowAllSeasonsWithEpisodes(tvId)

        if (!seasonsWithEpisodes || seasonsWithEpisodes.length === 0) {
            console.log('⚠️ Nessuna stagione trovata per la serie TV:', tvId)
            return NextResponse.json({
                success: true,
                data: []
            })
        }

        let refinedSeasons = seasonsWithEpisodes

        const episodesToProbe = seasonsWithEpisodes.flatMap((season) =>
            (season.episodes || [])
                .filter((episode: any) => episode.needsProbe)
                .map((episode: any) => ({
                    season: season.season_number,
                    episode: episode.episode_number,
                }))
        )

        if (episodesToProbe.length > 0) {
            try {
                const result = await checkEpisodesAvailability(tvId, episodesToProbe)
                if (result.showListed === false) {
                    refinedSeasons = []
                } else {
                    const missing = new Set(
                        (result.availability || [])
                            .filter((item) => item.available === false)
                            .map((item) => `${item.season}-${item.episode}`)
                    )
                    refinedSeasons = seasonsWithEpisodes.map((season) => {
                        const availableEpisodes = season.episodes.filter(
                            (episode: any) => !missing.has(`${season.season_number}-${episode.episode_number}`)
                        )
                        return {
                            ...season,
                            episodes: availableEpisodes,
                            episode_count: availableEpisodes.length,
                        }
                    }).filter((season) => season.episodes.length > 0)
                }
            } catch (error) {
                console.error('❌ Errore nel controllo disponibilità VixSrc per', tvId, error)
            }
        }

        console.log('✅ Stagioni trovate:', refinedSeasons.length, refinedSeasons.map((season) => season.episode_count))

        return NextResponse.json({
            success: true,
            data: refinedSeasons
        })

    } catch (error) {
        console.error('❌ Errore nel recupero stagioni serie TV:', error)

        return NextResponse.json({
            success: false,
            error: 'Errore interno del server'
        }, { status: 500 })
    }
}

