const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export const PAIR_CODE_LENGTH = 8

export function generatePairCode(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(PAIR_CODE_LENGTH))
    return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join('')
}

export function normalizePairCode(input: string): string {
    return input.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, '')
}

export function formatPairCode(code: string): string {
    const raw = normalizePairCode(code)
    if (raw.length !== PAIR_CODE_LENGTH) {
        return raw
    }
    return `${raw.slice(0, 4)}-${raw.slice(4)}`
}

export function splitPairCode(code: string): { left: string; right: string } {
    const raw = normalizePairCode(code)
    return {
        left: raw.slice(0, 4),
        right: raw.slice(4, PAIR_CODE_LENGTH),
    }
}

export function isValidPairCode(input: string): boolean {
    return normalizePairCode(input).length === PAIR_CODE_LENGTH
}
