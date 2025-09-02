import { prisma } from '@/lib/db'
import { User } from '@/types'
import bcrypt from 'bcryptjs'

export class UserRepository {
    async findById(id: string): Promise<User | null> {
        try {
            const user = await prisma.user.findUnique({
                where: { id },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    avatar: true,
                    createdAt: true,
                    updatedAt: true
                }
            })
            return user
        } catch (error) {
            throw new Error(`Errore nel recupero utente: ${error}`)
        }
    }

    async findByEmail(email: string): Promise<User & { password: string } | null> {
        try {
            const user = await prisma.user.findUnique({
                where: { email }
            })
            return user
        } catch (error) {
            throw new Error(`Errore nel recupero utente per email: ${error}`)
        }
    }

    async findByUsername(username: string): Promise<User | null> {
        try {
            const user = await prisma.user.findUnique({
                where: { username },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    avatar: true,
                    createdAt: true,
                    updatedAt: true
                }
            })
            return user
        } catch (error) {
            throw new Error(`Errore nel recupero utente per username: ${error}`)
        }
    }

    async create(email: string, username: string, password: string): Promise<User> {
        try {
            const hashedPassword = await bcrypt.hash(password, 12)

            const user = await prisma.user.create({
                data: {
                    email,
                    username,
                    password: hashedPassword
                },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    avatar: true,
                    createdAt: true,
                    updatedAt: true
                }
            })

            return user
        } catch (error) {
            throw new Error(`Errore nella creazione utente: ${error}`)
        }
    }

    async update(id: string, data: Partial<Pick<User, 'username' | 'avatar'>>): Promise<User> {
        try {
            const user = await prisma.user.update({
                where: { id },
                data,
                select: {
                    id: true,
                    email: true,
                    username: true,
                    avatar: true,
                    createdAt: true,
                    updatedAt: true
                }
            })

            return user
        } catch (error) {
            throw new Error(`Errore nell'aggiornamento utente: ${error}`)
        }
    }

    async updatePassword(id: string, newPassword: string): Promise<void> {
        try {
            const hashedPassword = await bcrypt.hash(newPassword, 12)

            await prisma.user.update({
                where: { id },
                data: { password: hashedPassword }
            })
        } catch (error) {
            throw new Error(`Errore nell'aggiornamento password: ${error}`)
        }
    }

    async delete(id: string): Promise<void> {
        try {
            await prisma.user.delete({
                where: { id }
            })
        } catch (error) {
            throw new Error(`Errore nell'eliminazione utente: ${error}`)
        }
    }

    async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
        try {
            return await bcrypt.compare(password, hashedPassword)
        } catch (error) {
            throw new Error(`Errore nella verifica password: ${error}`)
        }
    }
}
