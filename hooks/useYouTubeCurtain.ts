'use client'

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import {
    curtainActionForState,
    killYouTubeCaptions,
    listenToYouTubePlayer,
    readYouTubePlayerState,
    restartYouTubePreview,
    startYouTubePreview,
} from '@/lib/youtube-command'

export const YOUTUBE_CHROME_MS = 7000
export const YOUTUBE_DISSOLVE_MS = 450
export const YOUTUBE_DISSOLVE_EASE = 'cubic-bezier(0.25, 0.1, 0.25, 1)'

type UseYouTubeCurtainOptions = {
    enabled: boolean
    muted: boolean
    loop: boolean
    onEnded?: () => void
}

export function useYouTubeCurtain(
    iframeRef: RefObject<HTMLIFrameElement | null>,
    { enabled, muted, loop, onEnded }: UseYouTubeCurtainOptions
) {
    const [revealed, setRevealed] = useState(false)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const armedRef = useRef(false)
    const mutedRef = useRef(muted)
    const loopRef = useRef(loop)
    const onEndedRef = useRef(onEnded)
    const enabledRef = useRef(enabled)
    mutedRef.current = muted
    loopRef.current = loop
    onEndedRef.current = onEnded
    enabledRef.current = enabled

    const frame = useCallback(() => iframeRef.current?.contentWindow, [iframeRef])

    const clearTimer = useCallback(() => {
        if (!timerRef.current) return
        clearTimeout(timerRef.current)
        timerRef.current = null
    }, [])

    const cover = useCallback(() => {
        clearTimer()
        armedRef.current = false
        setRevealed(false)
    }, [clearTimer])

    const scheduleReveal = useCallback(() => {
        if (timerRef.current || !enabledRef.current) return
        timerRef.current = setTimeout(() => {
            timerRef.current = null
            if (enabledRef.current) setRevealed(true)
        }, YOUTUBE_CHROME_MS)
    }, [])

    useEffect(() => {
        if (!enabled) cover()
    }, [cover, enabled])

    useEffect(() => () => cover(), [cover])

    const kickPlayback = useCallback(() => {
        const win = frame()
        startYouTubePreview(win, mutedRef.current)
        listenToYouTubePlayer(win)
        killYouTubeCaptions(win)
        scheduleReveal()
    }, [frame, scheduleReveal])

    useEffect(() => {
        const onMessage = (event: MessageEvent) => {
            if (!enabledRef.current) return
            const state = readYouTubePlayerState(event.origin, event.data)
            if (state == null) return

            const action = curtainActionForState(state, armedRef.current, loopRef.current)
            if (action === 'arm') {
                armedRef.current = true
                killYouTubeCaptions(frame())
                scheduleReveal()
                return
            }
            if (action === 'loop') {
                cover()
                restartYouTubePreview(frame(), mutedRef.current)
                listenToYouTubePlayer(frame())
                killYouTubeCaptions(frame())
                scheduleReveal()
                return
            }
            if (action === 'ended') {
                onEndedRef.current?.()
            }
        }

        window.addEventListener('message', onMessage)
        return () => window.removeEventListener('message', onMessage)
    }, [cover, frame, scheduleReveal])

    return { revealed, kickPlayback }
}
