import { describe, expect, it } from 'vitest'
import { firstFulfilled } from './first-fulfilled'

describe('firstFulfilled', () => {
    it('prende il primo successo anche se l’altro fallisce prima', async () => {
        const slow = new Promise<string>((resolve) => setTimeout(() => resolve('ok'), 20))
        const failed = Promise.reject(new Error('nope'))
        await expect(firstFulfilled([failed, slow])).resolves.toBe('ok')
    })

    it('rifiuta se falliscono tutti', async () => {
        await expect(firstFulfilled([Promise.reject(new Error('a')), Promise.reject(new Error('b'))])).rejects.toThrow(
            'b'
        )
    })
})
