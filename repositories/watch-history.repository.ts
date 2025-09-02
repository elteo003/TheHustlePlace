import { prisma } from '@/lib/db'
import { WatchHistory } from '@/types'

export class WatchHistoryRepository {
    async findByUserId(userId: string, limit: number = 50): Promise<WatchHistory[]> {
        try {
            const history = await prisma.watchHistory.findMany({
                where: { userId },
                orderBy: { watchedAt: 'desc' },
                take: limit
            })
            return history
        } catch (error) {
            throw new Error(`Errore nel recupero cronologia: ${error}`)
        }
    }

    async findByUserAndItem(userId: string, tmdbId: number, type: 'movie' | 'tv', season?: number, episode?: number): Promise<WatchHistory | null> {
        try {
            const history = await prisma.watchHistory.findFirst({
                where: {
                    userId,
                    tmdbId,
                    type,
                    ...(type === 'tv' && season && episode ? { season, episode } : {})
                }
            })
            return history
        } catch (error) {
            throw new Error(`Errore nel recupero cronologia item: ${error}`)
        }
    }

    async add(userId: string, tmdbId: number, type: 'movie' | 'tv', title: string, poster?: string, season?: number, episode?: number, duration?: number, progress?: number): Promise<WatchHistory> {
        try {
            const history = await prisma.watchHistory.create({
                data: {
                    userId,
                    tmdbId,
                    type,
                    title,
                    poster,
                    season,
                    episode,
                    duration,
                    progress
                }
            })
            return history
        } catch (error) {
            throw new Error(`Errore nell'aggiunta alla cronologia: ${error}`)
        }
    }

    async update(userId: string, tmdbId: number, type: 'movie' | 'tv', data: Partial<Pick<WatchHistory, 'duration' | 'progress'>>, season?: number, episode?: number): Promise<WatchHistory> {
        try {
            const history = await prisma.watchHistory.updateMany({
                where: {
                    userId,
                    tmdbId,
                    type,
                    ...(type === 'tv' && season && episode ? { season, episode } : {})
                },
                data
            })

            // Return the updated record
            const updatedHistory = await this.findByUserAndItem(userId, tmdbId, type, season, episode)
            if (!updatedHistory) {
                throw new Error('Cronologia non trovata dopo l\'aggiornamento')
            }

            return updatedHistory
        } catch (error) {
            throw new Error(`Errore nell'aggiornamento cronologia: ${error}`)
        }
    }

    async remove(userId: string, tmdbId: number, type: 'movie' | 'tv', season?: number, episode?: number): Promise<void> {
        try {
            await prisma.watchHistory.deleteMany({
                where: {
                    userId,
                    tmdbId,
                    type,
                    ...(type === 'tv' && season && episode ? { season, episode } : {})
                }
            })
        } catch (error) {
            throw new Error(`Errore nella rimozione dalla cronologia: ${error}`)
        }
    }

    async clearUserHistory(userId: string): Promise<void> {
        try {
            await prisma.watchHistory.deleteMany({
                where: { userId }
            })
        } catch (error) {
            throw new Error(`Errore nella pulizia cronologia: ${error}`)
        }
    }

    async getContinueWatching(userId: string, limit: number = 10): Promise<WatchHistory[]> {
        try {
            const history = await prisma.watchHistory.findMany({
                where: {
                    userId,
                    progress: {
                        gt: 0,
                        lt: 1
                    }
                },
                orderBy: { watchedAt: 'desc' },
                take: limit
            })
            return history
        } catch (error) {
            throw new Error(`Errore nel recupero "Continua a guardare": ${error}`)
        }
    }
}
