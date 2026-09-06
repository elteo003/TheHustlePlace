export function postYouTubeCommand(
    frame: Window | null | undefined,
    func: string,
    args: unknown[] = []
) {
    if (!frame) return
    frame.postMessage(JSON.stringify({ event: 'command', func, args }), 'https://www.youtube.com')
}

export function startYouTubePreview(frame: Window | null | undefined, muted: boolean) {
    postYouTubeCommand(frame, 'playVideo')
    postYouTubeCommand(frame, muted ? 'mute' : 'unMute')
    if (!muted) {
        postYouTubeCommand(frame, 'setVolume', [100])
    }
}
