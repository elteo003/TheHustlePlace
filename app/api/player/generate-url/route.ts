import { NextRequest } from 'next/server'
import { generatePlayerUrlHandler } from '@/controllers/player.controller'

export async function POST(request: NextRequest) {
  return generatePlayerUrlHandler(request)
}
