import { PAIR_CODE_LENGTH } from '@/lib/pair-code'

export const PAIR_PAD_ROWS = [
    ['A', 'B', 'C', 'D', 'E', 'F'],
    ['G', 'H', 'J', 'K', 'L', 'M'],
    ['N', 'P', 'Q', 'R', 'S', 'T'],
    ['U', 'V', 'W', 'X', 'Y', 'Z'],
    ['2', '3', '4', '5', '6', '7'],
    ['8', '9'],
] as const

export function appendPairChar(current: string, char: string): string {
    const next = `${current}${char}`.replace(/[^A-HJ-NP-Z2-9]/g, '')
    return next.slice(0, PAIR_CODE_LENGTH)
}
