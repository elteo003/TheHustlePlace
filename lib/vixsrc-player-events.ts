export const VIXSRC_PLAYER_EVENTS = ['play', 'pause', 'seeked', 'ended', 'timeupdate'] as const

export type VixsrcPlayerEventName = (typeof VIXSRC_PLAYER_EVENTS)[number]

export interface VixsrcPlayerEvent {
    event: VixsrcPlayerEventName
    currentTime: number
    duration: number
    video_id?: number
}

function isVixsrcOrigin(origin: string): boolean {
    try {
        const host = new URL(origin).hostname
        return host === 'vixsrc.to' || host.endsWith('.vixsrc.to')
    } catch {
        return typeof origin === 'string' && origin.includes('vixsrc.to')
    }
}

function isEventName(value: unknown): value is VixsrcPlayerEventName {
    return typeof value === 'string' && (VIXSRC_PLAYER_EVENTS as readonly string[]).includes(value)
}

function asPayload(value: unknown): VixsrcPlayerEvent | null {
    if (!value || typeof value !== 'object') return null
    const payload = value as Record<string, unknown>
    if (!isEventName(payload.event)) return null
    const currentTime = Number(payload.currentTime)
    const duration = Number(payload.duration)
    if (!Number.isFinite(currentTime) || !Number.isFinite(duration)) return null
    return {
        event: payload.event,
        currentTime,
        duration,
        video_id: typeof payload.video_id === 'number' ? payload.video_id : undefined,
    }
}

/** Accetta il formato inoltrato da VixSrc (`event`) e quello della loro doc (`data`). */
export function parseVixsrcPlayerMessage(origin: string, data: unknown): VixsrcPlayerEvent | null {
    if (!isVixsrcOrigin(origin) || !data || typeof data !== 'object') return null
    const message = data as Record<string, unknown>
    if (message.type !== 'PLAYER_EVENT') return null
    return asPayload(message.event) ?? asPayload(message.data)
}
