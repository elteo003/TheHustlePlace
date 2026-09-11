import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = dirname(fileURLToPath(import.meta.url))

function crc32(buf) {
    let crc = 0xffffffff
    for (const byte of buf) {
        crc ^= byte
        for (let i = 0; i < 8; i += 1) {
            crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1
        }
    }
    return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
    const typeBuf = Buffer.from(type)
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length)
    const crc = Buffer.alloc(4)
    crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
    return Buffer.concat([len, typeBuf, data, crc])
}

function png(size) {
    const raw = Buffer.alloc((size * 4 + 1) * size)
    for (let y = 0; y < size; y += 1) {
        const row = y * (size * 4 + 1)
        raw[row] = 0
        for (let x = 0; x < size; x += 1) {
            const i = row + 1 + x * 4
            const inset = Math.floor(size * 0.18)
            const inside = x >= inset && x < size - inset && y >= inset && y < size - inset
            if (inside) {
                raw[i] = 255
                raw[i + 1] = 255
                raw[i + 2] = 255
                raw[i + 3] = 255
            } else {
                raw[i + 3] = 255
            }
        }
    }

    const ihdr = Buffer.alloc(13)
    ihdr.writeUInt32BE(size, 0)
    ihdr.writeUInt32BE(size, 4)
    ihdr[8] = 8
    ihdr[9] = 6

    return Buffer.concat([
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
        chunk('IHDR', ihdr),
        chunk('IDAT', deflateSync(raw)),
        chunk('IEND', Buffer.alloc(0)),
    ])
}

writeFileSync(join(dir, 'icon.png'), png(80))
writeFileSync(join(dir, 'largeIcon.png'), png(130))
console.log('icone webOS scritte')
