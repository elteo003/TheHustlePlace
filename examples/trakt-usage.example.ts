/**
 * Esempio di utilizzo del servizio Trakt.tv
 * 
 * Questo file mostra come utilizzare il servizio Trakt.tv
 * per recuperare dati di film e serie TV con cache Redis
 * 
 * @author Streaming Platform
 * @version 1.0.0
 */

import { getTop10Movies, getTop10Shows, getUpcomingMovies } from '../services/trakt.service'

/**
 * Esempio di utilizzo base del servizio Trakt.tv
 * Mostra come recuperare i dati e gestire gli errori
 */
async function exampleUsage() {
    console.log('🎬 Esempio utilizzo servizio Trakt.tv\n')

    try {
        // 1. Recupera top 10 film popolari
        console.log('📽️ Recupero top 10 film popolari...')
        const topMovies = await getTop10Movies()
        
        if (topMovies.length > 0) {
            console.log(`✅ Recuperati ${topMovies.length} film popolari`)
            console.log('Primi 3 film:')
            topMovies.slice(0, 3).forEach((movie, index) => {
                console.log(`  ${index + 1}. ${movie.title} (${movie.year}) - Rating: ${movie.rating}`)
            })
        } else {
            console.log('⚠️ Nessun film recuperato (possibile errore API o cache vuota)')
        }

        console.log('\n' + '='.repeat(50) + '\n')

        // 2. Recupera top 10 serie TV popolari
        console.log('📺 Recupero top 10 serie TV popolari...')
        const topShows = await getTop10Shows()
        
        if (topShows.length > 0) {
            console.log(`✅ Recuperate ${topShows.length} serie TV popolari`)
            console.log('Prime 3 serie:')
            topShows.slice(0, 3).forEach((show, index) => {
                console.log(`  ${index + 1}. ${show.title} (${show.year}) - Rating: ${show.rating}`)
            })
        } else {
            console.log('⚠️ Nessuna serie TV recuperata (possibile errore API o cache vuota)')
        }

        console.log('\n' + '='.repeat(50) + '\n')

        // 3. Recupera nuove uscite cinema
        console.log('🎭 Recupero nuove uscite cinema...')
        const upcomingMovies = await getUpcomingMovies()
        
        if (upcomingMovies.length > 0) {
            console.log(`✅ Recuperate ${upcomingMovies.length} nuove uscite`)
            console.log('Prime 3 uscite:')
            upcomingMovies.slice(0, 3).forEach((item, index) => {
                console.log(`  ${index + 1}. ${item.movie.title} - Uscita: ${item.released}`)
            })
        } else {
            console.log('⚠️ Nessuna nuova uscita recuperata (possibile errore API o cache vuota)')
        }

    } catch (error) {
        console.error('❌ Errore durante l\'esecuzione dell\'esempio:', error)
    }
}

/**
 * Esempio di utilizzo in un endpoint API Next.js
 * Mostra come integrare il servizio in un'API route
 */
export async function apiEndpointExample() {
    try {
        // Recupera tutti i dati in parallelo per performance ottimali
        const [topMovies, topShows, upcomingMovies] = await Promise.all([
            getTop10Movies(),
            getTop10Shows(),
            getUpcomingMovies()
        ])

        // Restituisci i dati formattati per il frontend
        return {
            success: true,
            data: {
                topMovies,
                topShows,
                upcomingMovies,
                timestamp: new Date().toISOString(),
                source: 'trakt.tv'
            }
        }

    } catch (error) {
        console.error('Errore API endpoint Trakt.tv:', error)
        
        // Restituisci errore formattato
        return {
            success: false,
            error: 'Errore nel recupero dati da Trakt.tv',
            data: {
                topMovies: [],
                topShows: [],
                upcomingMovies: []
            }
        }
    }
}

/**
 * Esempio di utilizzo con gestione cache personalizzata
 * Mostra come controllare manualmente la cache
 */
export async function cacheExample() {
    console.log('🗄️ Esempio gestione cache personalizzata\n')

    try {
        // Prima chiamata - dovrebbe andare all'API
        console.log('Prima chiamata (dovrebbe andare all\'API)...')
        const start1 = Date.now()
        const movies1 = await getTop10Movies()
        const time1 = Date.now() - start1
        console.log(`Tempo prima chiamata: ${time1}ms`)

        // Seconda chiamata - dovrebbe andare alla cache
        console.log('\nSeconda chiamata (dovrebbe andare alla cache)...')
        const start2 = Date.now()
        const movies2 = await getTop10Movies()
        const time2 = Date.now() - start2
        console.log(`Tempo seconda chiamata: ${time2}ms`)

        console.log(`\nMiglioramento performance: ${((time1 - time2) / time1 * 100).toFixed(1)}%`)

    } catch (error) {
        console.error('❌ Errore nell\'esempio cache:', error)
    }
}

/**
 * Esempio di utilizzo con filtri personalizzati
 * Mostra come filtrare i dati recuperati
 */
export async function filterExample() {
    console.log('🔍 Esempio filtri personalizzati\n')

    try {
        const topMovies = await getTop10Movies()
        
        // Filtra film con rating alto
        const highRatedMovies = topMovies.filter(movie => movie.rating >= 8.0)
        console.log(`Film con rating >= 8.0: ${highRatedMovies.length}`)

        // Filtra film recenti (ultimi 5 anni)
        const recentYear = new Date().getFullYear() - 5
        const recentMovies = topMovies.filter(movie => movie.year >= recentYear)
        console.log(`Film recenti (dal ${recentYear}): ${recentMovies.length}`)

        // Filtra per genere
        const actionMovies = topMovies.filter(movie => 
            movie.genres.some(genre => 
                genre.toLowerCase().includes('action') || 
                genre.toLowerCase().includes('azione')
            )
        )
        console.log(`Film d'azione: ${actionMovies.length}`)

    } catch (error) {
        console.error('❌ Errore nell\'esempio filtri:', error)
    }
}

// Esegui l'esempio se il file viene eseguito direttamente
if (require.main === module) {
    exampleUsage()
        .then(() => {
            console.log('\n✅ Esempio completato con successo!')
            process.exit(0)
        })
        .catch((error) => {
            console.error('\n❌ Errore nell\'esecuzione dell\'esempio:', error)
            process.exit(1)
        })
}
