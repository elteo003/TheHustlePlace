import { prisma } from '@/lib/db'
import { Favorite } from '@/types'

export class FavoritesRepository {
    async findByUserId(userId: string): Promise<Favorite[]> {
        try {
            const favorites = await prisma.favorite.findMany({
                where: { userId },
                orderBy: { addedAt: 'desc' }
            })
            return favorites
        } catch (error) {
            throw new Error(`Errore nel recupero preferiti: ${error}`)
        }
    }

    async findByUserAndItem(userId: string, tmdbId: number, type: 'movie' | 'tv'): Promise<Favorite | null> {
        try {
            const favorite = await prisma.favorite.findUnique({
                where: {
                    userId_tmdbId_type: {
                        userId,
                        tmdbId,
                        type
                    }
                }
            })
            return favorite
        } catch (error) {
            throw new Error(`Errore nel recupero preferito: ${error}`)
        }
    }

    async add(userId: string, tmdbId: number, type: 'movie' | 'tv', title: string, poster?: string): Promise<Favorite> {
        try {
            const favorite = await prisma.favorite.create({
                data: {
                    userId,
                    tmdbId,
                    type,
                    title,
                    poster
                }
            })
            return favorite
        } catch (error) {
            throw new Error(`Errore nell'aggiunta ai preferiti: ${error}`)
        }
    }

    async remove(userId: string, tmdbId: number, type: 'movie' | 'tv'): Promise<void> {
        try {
            await prisma.favorite.delete({
                where: {
                    userId_tmdbId_type: {
                        userId,
                        tmdbId,
                        type
                    }
                }
            })
        } catch (error) {
            throw new Error(`Errore nella rimozione dai preferiti: ${error}`)
        }
    }

    async isFavorite(userId: string, tmdbId: number, type: 'movie' | 'tv'): Promise<boolean> {
        try {
            const favorite = await this.findByUserAndItem(userId, tmdbId, type)
            return favorite !== null
        } catch (error) {
            throw new Error(`Errore nel controllo preferiti: ${error}`)
        }
    }
}
