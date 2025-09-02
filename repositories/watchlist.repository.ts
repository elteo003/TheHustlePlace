import { prisma } from '@/lib/db'
import { WatchlistItem } from '@/types'

export class WatchlistRepository {
    async findByUserId(userId: string): Promise<WatchlistItem[]> {
        try {
            const items = await prisma.watchlistItem.findMany({
                where: { userId },
                orderBy: { addedAt: 'desc' }
            })
            return items
        } catch (error) {
            throw new Error(`Errore nel recupero watchlist: ${error}`)
        }
    }

    async findByUserAndItem(userId: string, tmdbId: number, type: 'movie' | 'tv'): Promise<WatchlistItem | null> {
        try {
            const item = await prisma.watchlistItem.findUnique({
                where: {
                    userId_tmdbId_type: {
                        userId,
                        tmdbId,
                        type
                    }
                }
            })
            return item
        } catch (error) {
            throw new Error(`Errore nel recupero item watchlist: ${error}`)
        }
    }

    async add(userId: string, tmdbId: number, type: 'movie' | 'tv', title: string, poster?: string): Promise<WatchlistItem> {
        try {
            const item = await prisma.watchlistItem.create({
                data: {
                    userId,
                    tmdbId,
                    type,
                    title,
                    poster
                }
            })
            return item
        } catch (error) {
            throw new Error(`Errore nell'aggiunta alla watchlist: ${error}`)
        }
    }

    async remove(userId: string, tmdbId: number, type: 'movie' | 'tv'): Promise<void> {
        try {
            await prisma.watchlistItem.delete({
                where: {
                    userId_tmdbId_type: {
                        userId,
                        tmdbId,
                        type
                    }
                }
            })
        } catch (error) {
            throw new Error(`Errore nella rimozione dalla watchlist: ${error}`)
        }
    }

    async isInWatchlist(userId: string, tmdbId: number, type: 'movie' | 'tv'): Promise<boolean> {
        try {
            const item = await this.findByUserAndItem(userId, tmdbId, type)
            return item !== null
        } catch (error) {
            throw new Error(`Errore nel controllo watchlist: ${error}`)
        }
    }
}
