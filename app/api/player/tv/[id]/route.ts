import { NextRequest, NextResponse } from 'next/server'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: tvId } = await params
        const url = request.nextUrl
        const season = url.searchParams.get('season') || '1'
        const episode = url.searchParams.get('episode') || '1'

        const vixsrcUrl = `https://vixsrc.to/tv/${tvId}/${season}/${episode}`

        console.log('Recupero video source per serie TV', { tvId, season, episode, vixsrcUrl })

        // Fai la chiamata a vixsrc.to dal server (no CORS)
        const response = await fetch(vixsrcUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        })

        if (response.ok) {
            const html = await response.text()

            // Cerca l'URL del video nella pagina HTML
            const videoUrlMatch = html.match(/src="([^"]*\.m3u8[^"]*)"/) ||
                html.match(/file:\s*["']([^"']*\.m3u8[^"']*)["']/) ||
                html.match(/source:\s*["']([^"']*\.m3u8[^"']*)["']/) ||
                html.match(/videoUrl:\s*["']([^"']*\.m3u8[^"']*)["']/)

            if (videoUrlMatch && videoUrlMatch[1]) {
                let videoUrl = videoUrlMatch[1]

                // Assicurati che l'URL sia completo
                if (!videoUrl.startsWith('http')) {
                    videoUrl = `https://vixsrc.to${videoUrl}`
                }

                console.log('Video source trovato per serie TV', { tvId, season, episode, videoUrl })

                return NextResponse.json({
                    success: true,
                    data: {
                        url: videoUrl,
                        quality: 'HD',
                        type: 'tv',
                        tmdbId: parseInt(tvId),
                        season: parseInt(season),
                        episode: parseInt(episode)
                    }
                })
            }
        }

        console.warn('Nessun video source trovato per serie TV', { tvId, season, episode })

        return NextResponse.json({
            success: false,
            error: 'Video source non trovato',
            fallbackUrl: vixsrcUrl
        })

    } catch (error) {
        const { id: tvId } = await params
        console.error('Errore nel recupero video source per serie TV', { error, tvId })

        return NextResponse.json({
            success: false,
            error: 'Errore nel recupero del video',
            fallbackUrl: `https://vixsrc.to/tv/${tvId}/1/1`
        }, { status: 500 })
    }
}
