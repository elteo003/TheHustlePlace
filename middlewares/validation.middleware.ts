import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/utils/logger'

export class ValidationMiddleware {
    static validateBody<T>(schema: z.ZodSchema<T>) {
        return (request: NextRequest): { data: T } | NextResponse => {
            try {
                const body = request.json()

                if (!body) {
                    return NextResponse.json(
                        { success: false, error: 'Body della richiesta mancante' },
                        { status: 400 }
                    )
                }

                const result = schema.safeParse(body)

                if (!result.success) {
                    const errors = result.error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))

                    logger.warn('Validazione fallita', { errors, body })

                    return NextResponse.json(
                        {
                            success: false,
                            error: 'Dati non validi',
                            details: errors
                        },
                        { status: 400 }
                    )
                }

                return { data: result.data }
            } catch (error) {
                logger.error('Errore nella validazione del body', { error })

                return NextResponse.json(
                    { success: false, error: 'Errore nella validazione dei dati' },
                    { status: 400 }
                )
            }
        }
    }

    static validateQuery<T>(schema: z.ZodSchema<T>) {
        return (request: NextRequest): { data: T } | NextResponse => {
            try {
                const url = new URL(request.url)
                const queryParams = Object.fromEntries(url.searchParams.entries())

                const result = schema.safeParse(queryParams)

                if (!result.success) {
                    const errors = result.error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))

                    logger.warn('Validazione query fallita', { errors, queryParams })

                    return NextResponse.json(
                        {
                            success: false,
                            error: 'Parametri query non validi',
                            details: errors
                        },
                        { status: 400 }
                    )
                }

                return { data: result.data }
            } catch (error) {
                logger.error('Errore nella validazione dei parametri query', { error })

                return NextResponse.json(
                    { success: false, error: 'Errore nella validazione dei parametri' },
                    { status: 400 }
                )
            }
        }
    }

    static validateParams<T>(schema: z.ZodSchema<T>) {
        return (request: NextRequest): { data: T } | NextResponse => {
            try {
                const url = new URL(request.url)
                const pathSegments = url.pathname.split('/').filter(Boolean)

                // Estrae i parametri dinamici dalla URL
                const params: Record<string, string> = {}

                // Questo è un esempio semplificato - in un'app reale potresti voler
                // mappare i segmenti del path ai nomi dei parametri
                if (pathSegments.length > 0) {
                    params.id = pathSegments[pathSegments.length - 1]
                }

                const result = schema.safeParse(params)

                if (!result.success) {
                    const errors = result.error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))

                    logger.warn('Validazione parametri fallita', { errors, params })

                    return NextResponse.json(
                        {
                            success: false,
                            error: 'Parametri non validi',
                            details: errors
                        },
                        { status: 400 }
                    )
                }

                return { data: result.data }
            } catch (error) {
                logger.error('Errore nella validazione dei parametri', { error })

                return NextResponse.json(
                    { success: false, error: 'Errore nella validazione dei parametri' },
                    { status: 400 }
                )
            }
        }
    }
}

// Schemi di validazione comuni
export const validationSchemas = {
    login: z.object({
        email: z.string().email('Email non valida'),
        password: z.string().min(6, 'Password deve essere di almeno 6 caratteri')
    }),

    register: z.object({
        email: z.string().email('Email non valida'),
        username: z.string().min(3, 'Username deve essere di almeno 3 caratteri').max(20, 'Username troppo lungo'),
        password: z.string().min(6, 'Password deve essere di almeno 6 caratteri')
    }),

    updateProfile: z.object({
        username: z.string().min(3, 'Username deve essere di almeno 3 caratteri').max(20, 'Username troppo lungo').optional(),
        avatar: z.string().url('URL avatar non valido').optional()
    }),

    changePassword: z.object({
        currentPassword: z.string().min(1, 'Password corrente richiesta'),
        newPassword: z.string().min(6, 'Nuova password deve essere di almeno 6 caratteri')
    }),

    catalogFilters: z.object({
        genre: z.string().transform(val => val ? parseInt(val) : undefined).optional(),
        year: z.string().transform(val => val ? parseInt(val) : undefined).optional(),
        language: z.string().optional(),
        sortBy: z.enum(['popularity', 'vote_average', 'release_date', 'title']).optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
        page: z.string().transform(val => val ? parseInt(val) : 1).optional()
    }),

    searchQuery: z.object({
        query: z.string().min(1, 'Query di ricerca richiesta'),
        page: z.string().transform(val => val ? parseInt(val) : 1).optional()
    }),

    tmdbId: z.object({
        id: z.string().transform(val => parseInt(val)).refine(val => !isNaN(val), 'ID non valido')
    }),

    tvEpisode: z.object({
        id: z.string().transform(val => parseInt(val)).refine(val => !isNaN(val), 'ID non valido'),
        season: z.string().transform(val => parseInt(val)).refine(val => !isNaN(val), 'Stagione non valida'),
        episode: z.string().transform(val => parseInt(val)).refine(val => !isNaN(val), 'Episodio non valido')
    })
}
