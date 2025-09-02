import { NextRequest } from 'next/server'
import { getTVShowEmbedHandler } from '@/controllers/player.controller'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; season: string; episode: string } }
) {
  // Aggiunge i parametri alla richiesta per la validazione
  const url = new URL(request.url)
  url.pathname = `/api/player/tv/${params.id}/${params.season}/${params.episode}`
  
  const modifiedRequest = new NextRequest(url, {
    method: request.method,
    headers: request.headers,
    body: request.body
  })

  return getTVShowEmbedHandler(modifiedRequest)
}
