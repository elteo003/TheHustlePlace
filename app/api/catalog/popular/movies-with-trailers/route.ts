import { NextRequest, NextResponse } from 'next/server'
import { tmdbWrapperService } from '@/services/tmdb-wrapper.service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        console.log('🎬 Recupero film popolari con trailer...')

        // Recupera i film popolari
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/catalog/popular/movies`)
        const popularData = await response.json()
        
        if (!popularData.success || !popularData.data) {
            throw new Error('Impossibile recuperare film popolari')
        }
        
        const popularMovies = popularData.data
        
        if (!popularMovies || popularMovies.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'Nessun film popolare disponibile'
            }, { status: 404 })
        }

        console.log(`📊 Trovati ${popularMovies.length} film popolari, verifico trailer...`)

        // Filtra solo film con trailer (massimo 10 per performance)
        const moviesWithTrailers = []
        const maxMovies = Math.min(10, popularMovies.length)

        for (let i = 0; i < maxMovies; i++) {
            const movie = popularMovies[i]
            
            try {
                // Verifica se il film ha trailer
                const videos = await tmdbWrapperService.getMovieVideos(movie.id)
                
                if (videos && videos.results && videos.results.length > 0) {
                    // Cerca trailer ufficiali su YouTube
                    const hasYouTubeTrailer = videos.results.some(video => 
                        video.site === 'YouTube' && 
                        (video.type === 'Trailer' || video.type === 'Teaser') &&
                        video.official === true
                    )
                    
                    if (hasYouTubeTrailer) {
                        moviesWithTrailers.push(movie)
                        console.log(`✅ ${movie.title} - Trailer trovato`)
                        
                        // Ferma quando abbiamo abbastanza film (5-8 per performance)
                        if (moviesWithTrailers.length >= 8) {
                            break
                        }
                    } else {
                        console.log(`❌ ${movie.title} - Nessun trailer YouTube ufficiale`)
                    }
                } else {
                    console.log(`❌ ${movie.title} - Nessun video disponibile`)
                }
            } catch (error) {
                console.log(`❌ ${movie.title} - Errore verifica trailer:`, error)
            }
        }

        // Se non troviamo abbastanza film con trailer, aggiungi film di fallback noti per avere trailer
        if (moviesWithTrailers.length < 3) {
            const fallbackMovies = [
                { id: 157336, title: 'Interstellar' },
                { id: 550, title: 'Fight Club' },
                { id: 13, title: 'Forrest Gump' },
                { id: 680, title: 'Pulp Fiction' },
                { id: 155, title: 'The Dark Knight' }
            ]
            
            for (const fallback of fallbackMovies) {
                if (moviesWithTrailers.length >= 8) break
                
                try {
                    const videos = await tmdbWrapperService.getMovieVideos(fallback.id)
                    if (videos && videos.results && videos.results.length > 0) {
                        const hasYouTubeTrailer = videos.results.some(video => 
                            video.site === 'YouTube' && 
                            (video.type === 'Trailer' || video.type === 'Teaser')
                        )
                        
                        if (hasYouTubeTrailer) {
                            // Recupera i dettagli completi del film
                            const movieDetails = await tmdbWrapperService.getMovieDetails(fallback.id)
                            if (movieDetails) {
                                moviesWithTrailers.push(movieDetails)
                                console.log(`✅ Fallback ${movieDetails.title} - Trailer trovato`)
                            }
                        }
                    }
                } catch (error) {
                    console.log(`❌ Fallback ${fallback.title} - Errore:`, error)
                }
            }
        }

        console.log(`🎬 Film con trailer trovati: ${moviesWithTrailers.length}`)

        return NextResponse.json({
            success: true,
            data: moviesWithTrailers,
            count: moviesWithTrailers.length
        })

    } catch (error) {
        console.error('❌ Errore nel recupero film con trailer:', error)

        return NextResponse.json({
            success: false,
            error: 'Errore interno del server'
        }, { status: 500 })
    }
}
