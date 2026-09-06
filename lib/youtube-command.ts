export const YOUTUBE_ORIGIN = 'https://www.youtube.com'
export const YOUTUBE_ENDED = 0
export const YOUTUBE_PLAYING = 1

export function postYouTubeCommand(
    frame: Window | null | undefined,
    func: string,
    args: unknown[] = []
) {
    if (!frame) return
    frame.postMessage(JSON.stringify({ event: 'command', func, args }), YOUTUBE_ORIGIN)
}

export function listenToYouTubePlayer(frame: Window | null | undefined) {
    if (!frame) return
    frame.postMessage(JSON.stringify({ event: 'listening' }), YOUTUBE_ORIGIN)
}

export function startYouTubePreview(frame: Window | null | undefined, muted: boolean) {
    postYouTubeCommand(frame, 'playVideo')
    postYouTubeCommand(frame, muted ? 'mute' : 'unMute')
    if (!muted) {
        postYouTubeCommand(frame, 'setVolume', [100])
    }
}

export function parseYouTubePlayerMessage(data: unknown): { event: string; info?: number } | null {
    let payload = data
    if (typeof data === 'string') {
        try {
            payload = JSON.parse(data)
        } catch {
            return null
        }
    }
    if (!payload || typeof payload !== 'object') return null
    const event = (payload as { event?: unknown }).event
    if (typeof event !== 'string') return null
    const info = (payload as { info?: unknown }).info
    return {
        event,
        info: typeof info === 'number' ? info : undefined,
    }
}

export function readYouTubePlayerState(origin: string, data: unknown): number | null {
    if (origin !== YOUTUBE_ORIGIN) return null
    const parsed = parseYouTubePlayerMessage(data)
    if (parsed?.event !== 'onStateChange' || parsed.info == null) return null
    return parsed.info
}

export function isYouTubeEndedMessage(origin: string, data: unknown): boolean {
    return readYouTubePlayerState(origin, data) === YOUTUBE_ENDED
}
