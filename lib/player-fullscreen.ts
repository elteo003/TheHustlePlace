type WebkitVideo = HTMLVideoElement & {
    webkitEnterFullscreen?: () => void
    webkitExitFullscreen?: () => void
    webkitDisplayingFullscreen?: boolean
    webkitSupportsFullscreen?: boolean
}

type FullscreenDocument = Document & {
    webkitFullscreenElement?: Element | null
    webkitExitFullscreen?: () => Promise<void> | void
}

type FullscreenElement = HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void
}

export function isPlayerFullscreen(
    video?: HTMLVideoElement | null,
    doc: Document = document
): boolean {
    const page = doc as FullscreenDocument
    const media = video as WebkitVideo | null | undefined
    return Boolean(
        page.fullscreenElement ||
            page.webkitFullscreenElement ||
            media?.webkitDisplayingFullscreen
    )
}

export function subscribePlayerFullscreen(video: HTMLVideoElement | null, onChange: () => void) {
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
    video?.addEventListener('webkitbeginfullscreen', onChange)
    video?.addEventListener('webkitendfullscreen', onChange)
    return () => {
        document.removeEventListener('fullscreenchange', onChange)
        document.removeEventListener('webkitfullscreenchange', onChange)
        video?.removeEventListener('webkitbeginfullscreen', onChange)
        video?.removeEventListener('webkitendfullscreen', onChange)
    }
}

export async function togglePlayerFullscreen(
    stage: HTMLElement | null,
    video: HTMLVideoElement | null,
    doc: Document = document
) {
    if (isPlayerFullscreen(video, doc)) {
        await exitPlayerFullscreen(video, doc)
        return
    }
    await enterPlayerFullscreen(stage, video, doc)
}

async function enterPlayerFullscreen(
    stage: HTMLElement | null,
    video: HTMLVideoElement | null,
    doc: Document
) {
    const target = (stage ?? video) as FullscreenElement | null
    const media = video as WebkitVideo | null
    const standardOk = Boolean(target?.requestFullscreen && doc.fullscreenEnabled !== false)

    // iPhone: requestFullscreen sul div non esiste o è disabilitato. Va chiamato
    // in sincrono sul tap, altrimenti iOS perde il user gesture.
    if (!standardOk && media?.webkitEnterFullscreen && media.webkitSupportsFullscreen !== false) {
        media.webkitEnterFullscreen()
        return
    }
    if (target?.requestFullscreen) {
        try {
            await target.requestFullscreen({ navigationUI: 'hide' })
            return
        } catch {
            // alcuni WebView rifiutano il div: prova il video nativo
        }
    }
    if (target?.webkitRequestFullscreen) {
        try {
            await target.webkitRequestFullscreen()
            return
        } catch {
            // fallback sotto
        }
    }
    if (media?.webkitEnterFullscreen && media.webkitSupportsFullscreen !== false) {
        media.webkitEnterFullscreen()
    }
}

async function exitPlayerFullscreen(video: HTMLVideoElement | null, doc: Document) {
    const page = doc as FullscreenDocument
    if (page.fullscreenElement && page.exitFullscreen) {
        await page.exitFullscreen()
        return
    }
    if (page.webkitFullscreenElement && page.webkitExitFullscreen) {
        await page.webkitExitFullscreen()
        return
    }
    const media = video as WebkitVideo | null
    if (media?.webkitDisplayingFullscreen && media.webkitExitFullscreen) {
        media.webkitExitFullscreen()
    }
}
