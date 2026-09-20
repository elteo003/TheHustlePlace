/** Pausa senza tasto recente: screensaver, stall, perdita di focus. */
export const UNEXPECTED_PAUSE_MS = 800

export function shouldResumeUnexpectedPause(input: {
    ended: boolean
    userPaused: boolean
    lastUserInputAt: number
    now: number
}): boolean {
    if (input.ended || input.userPaused) return false
    return input.now - input.lastUserInputAt > UNEXPECTED_PAUSE_MS
}

/** Play / Pause / PlayPause del telecomando webOS e tasti media. */
export function mediaTransportAction(
    key: string,
    keyCode: number
): 'play' | 'pause' | 'toggle' | null {
    if (key === 'MediaPause' || keyCode === 19) return 'pause'
    if (key === 'MediaPlay' || keyCode === 415) return 'play'
    if (key === 'MediaPlayPause' || key === ' ' || keyCode === 179 || keyCode === 463) {
        return 'toggle'
    }
    return null
}

export function userPausedFromTransport(
    action: 'play' | 'pause' | 'toggle',
    currentlyPaused: boolean
): boolean {
    if (action === 'pause') return true
    if (action === 'play') return false
    return !currentlyPaused
}
