export function shouldDismissSheet(offsetY: number, velocityY: number): boolean {
    return offsetY > 80 || velocityY > 500
}
