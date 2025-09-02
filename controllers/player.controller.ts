import { NextRequest, NextResponse } from 'next/server'
import { PlayerService } from '@/services/player.service'
import { ValidationMiddleware, validationSchemas } from '@/middlewares/validation.middleware'
import { logger } from '@/utils/logger'

export class PlayerController {
    private playerService: PlayerService

    constructor() {
        this.playerService = new PlayerService()
    }

    async getMovieEmbed(request: NextRequest): Promise<NextResponse> {
        try {
            const validation = ValidationMiddleware.validateParams(validationSchemas.tmdbId)
            const validationResult = validation(request)

            if (validationResult instanceof NextResponse) {
                return validationResult
            }

            const { data } = validationResult
            const embed = await this.playerService.getMovieEmbed(data.id)

            return NextResponse.json({
                success: true,
                data: embed,
                message: 'Embed film recuperato con successo'
            })
        } catch (error) {
            logger.error('Errore nel recupero embed film', { error })

            return NextResponse.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : 'Errore interno del server'
                },
                { status: 500 }
            )
        }
    }

    async getTVShowEmbed(request: NextRequest): Promise<NextResponse> {
        try {
            const validation = ValidationMiddleware.validateParams(validationSchemas.tvEpisode)
            const validationResult = validation(request)

            if (validationResult instanceof NextResponse) {
                return validationResult
            }

            const { data } = validationResult
            const embed = await this.playerService.getTVShowEmbed(data.id, data.season, data.episode)

            return NextResponse.json({
                success: true,
                data: embed,
                message: 'Embed serie TV recuperato con successo'
            })
        } catch (error) {
            logger.error('Errore nel recupero embed serie TV', { error })

            return NextResponse.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : 'Errore interno del server'
                },
                { status: 500 }
            )
        }
    }

    async generatePlayerUrl(request: NextRequest): Promise<NextResponse> {
        try {
            const body = await request.json()
            const { embed, options = {} } = body

            if (!embed) {
                return NextResponse.json(
                    { success: false, error: 'Embed mancante' },
                    { status: 400 }
                )
            }

            const playerUrl = this.playerService.generatePlayerUrl(embed, options)

            return NextResponse.json({
                success: true,
                data: { playerUrl },
                message: 'URL player generato con successo'
            })
        } catch (error) {
            logger.error('Errore nella generazione URL player', { error })

            return NextResponse.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : 'Errore interno del server'
                },
                { status: 500 }
            )
        }
    }
}

// Esporta le funzioni handler
export const playerController = new PlayerController()

export const getMovieEmbedHandler = playerController.getMovieEmbed.bind(playerController)
export const getTVShowEmbedHandler = playerController.getTVShowEmbed.bind(playerController)
export const generatePlayerUrlHandler = playerController.generatePlayerUrl.bind(playerController)
