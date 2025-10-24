import { NextRequest } from 'next/server'
import { getTVShowEmbedHandler } from '@/controllers/player.controller'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; season: string; episode: string }> }
) {
  // Aggiunge i parametri alla richiesta per la validazione
  const { id, season, episode } = await params
  const url = request.nextUrl
  url.pathname = `/api/player/tv/${id}/${season}/${episode}`

  const modifiedRequest = new NextRequest(url, {
    method: request.method,
    headers: request.headers,
    body: request.body
  })

  return getTVShowEmbedHandler(modifiedRequest)
}
