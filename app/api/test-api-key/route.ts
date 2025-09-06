import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const apiKey = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY
        
        if (!apiKey) {
            return NextResponse.json({
                success: false,
                message: 'TMDB_API_KEY non configurata',
                hasApiKey: false
            })
        }

        return NextResponse.json({
            success: true,
            message: 'API key configurata correttamente',
            hasApiKey: true,
            apiKeyLength: apiKey.length
        })
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: 'Errore nel controllo API key',
            hasApiKey: false,
            error: error instanceof Error ? error.message : 'Errore sconosciuto'
        }, { status: 500 })
    }
}


