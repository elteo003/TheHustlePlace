import { afterEach, describe, expect, it, vi } from 'vitest'
import {
    HOME_RELAY_COOLDOWN_MS,
    HomeRelayCircuit,
    interpretHomeRelayResponse,
} from './vixsrc-home-relay'

describe('interpretHomeRelayResponse', () => {
    it('accetta una playlist valida', () => {
        const outcome = interpretHomeRelayResponse(
            200,
            JSON.stringify({ success: true, data: { master: '#EXTM3U', parts: { p0: '#EXTM3U' }, videoId: 12 } })
        )
        expect(outcome).toEqual({
            ok: true,
            data: { master: '#EXTM3U', parts: { p0: '#EXTM3U' }, videoId: 12 },
        })
    })

    it('non mette in cooldown un titolo assente sul relay vivo', () => {
        expect(
            interpretHomeRelayResponse(502, JSON.stringify({ success: false, error: 'playlist non trovata' }))
        ).toEqual({ ok: false, coolDown: false })
    })

    it('mette in cooldown tunnel morto o HTML di Cloudflare', () => {
        expect(interpretHomeRelayResponse(200, '<!doctype html><title>Cloudflare</title>')).toEqual({
            ok: false,
            coolDown: true,
        })
        expect(interpretHomeRelayResponse(503, JSON.stringify({ success: false, error: 'bad gateway' }))).toEqual({
            ok: false,
            coolDown: true,
        })
        expect(interpretHomeRelayResponse(503, JSON.stringify({ success: false, error: 'relay occupato' }))).toEqual({
            ok: false,
            coolDown: false,
        })
        expect(interpretHomeRelayResponse(401, JSON.stringify({ success: false, error: 'unauthorized' }))).toEqual({
            ok: false,
            coolDown: true,
        })
        expect(interpretHomeRelayResponse(200, '{not json')).toEqual({ ok: false, coolDown: true })
    })
})

describe('HomeRelayCircuit', () => {
    afterEach(() => {
        vi.useRealTimers()
    })

    it('dopo un fallimento salta il relay fino al cooldown', () => {
        vi.useFakeTimers()
        vi.setSystemTime(0)
        const circuit = new HomeRelayCircuit()
        expect(circuit.allow()).toBe(true)
        circuit.fail()
        expect(circuit.allow()).toBe(false)
        vi.setSystemTime(HOME_RELAY_COOLDOWN_MS - 1)
        expect(circuit.allow()).toBe(false)
        vi.setSystemTime(HOME_RELAY_COOLDOWN_MS)
        expect(circuit.allow()).toBe(true)
        circuit.succeed()
        expect(circuit.allow()).toBe(true)
    })
})
