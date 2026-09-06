export function readPageScrollMetrics(
    win: Pick<Window, 'innerHeight' | 'scrollY'>,
    doc: {
        documentElement: { scrollHeight: number; offsetHeight: number; scrollTop: number }
        body: { scrollHeight: number; offsetHeight: number; scrollTop: number }
    }
) {
    const clientHeight = win.innerHeight
    const scrollHeight = Math.max(
        doc.documentElement.scrollHeight,
        doc.body.scrollHeight,
        doc.documentElement.offsetHeight,
        doc.body.offsetHeight
    )
    const scrollTop =
        win.scrollY || doc.documentElement.scrollTop || doc.body.scrollTop || 0

    return {
        clientHeight,
        scrollHeight,
        scrollTop,
        canScroll: scrollHeight > clientHeight + 2,
    }
}
