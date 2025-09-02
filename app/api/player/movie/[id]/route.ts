import { NextRequest, NextResponse } from 'next/server'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const movieId = params.id
        const vixsrcUrl = `https://vixsrc.to/movie/${movieId}`

        console.log('Recupero video source per film', { movieId, vixsrcUrl })

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

                console.log('Video source trovato per film', { movieId, videoUrl })

                return NextResponse.json({
                    success: true,
                    data: {
                        url: videoUrl,
                        quality: 'HD',
                        type: 'movie',
                        tmdbId: parseInt(movieId)
                    }
                })
            }
        }

        console.warn('Nessun video source trovato per film', { movieId })

        return NextResponse.json({
            success: false,
            error: 'Video source non trovato',
            fallbackUrl: vixsrcUrl
        })

    } catch (error) {
        console.error('Errore nel recupero video source per film', { error, movieId: params.id })

        return NextResponse.json({
            success: false,
            error: 'Errore nel recupero del video',
            fallbackUrl: `https://vixsrc.to/movie/${params.id}`
        }, { status: 500 })
    }
}