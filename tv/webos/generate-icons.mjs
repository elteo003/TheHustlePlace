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

function png(width, height, paint) {
    const raw = Buffer.alloc((width * 4 + 1) * height)
    for (let y = 0; y < height; y += 1) {
        const row = y * (width * 4 + 1)
        raw[row] = 0
        for (let x = 0; x < width; x += 1) {
            const i = row + 1 + x * 4
            const pixel = paint(x, y)
            raw[i] = pixel[0]
            raw[i + 1] = pixel[1]
            raw[i + 2] = pixel[2]
            raw[i + 3] = pixel[3]
        }
    }

    const ihdr = Buffer.alloc(13)
    ihdr.writeUInt32BE(width, 0)
    ihdr.writeUInt32BE(height, 4)
    ihdr[8] = 8
    ihdr[9] = 6

    return Buffer.concat([
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
        chunk('IHDR', ihdr),
        chunk('IDAT', deflateSync(raw)),
        chunk('IEND', Buffer.alloc(0)),
    ])
}

function markPaint(size) {
    const inset = Math.floor(size * 0.18)
    return function paint(x, y) {
        const inside = x >= inset && x < size - inset && y >= inset && y < size - inset
        return inside ? [255, 255, 255, 255] : [0, 0, 0, 255]
    }
}

function splashPaint(x, y) {
    const cx = 960
    const cy = 540
    const half = 56
    const inside = x >= cx - half && x < cx + half && y >= cy - half && y < cy + half
    return inside ? [255, 255, 255, 255] : [0, 0, 0, 255]
}

writeFileSync(join(dir, 'icon.png'), png(80, 80, markPaint(80)))
writeFileSync(join(dir, 'largeIcon.png'), png(130, 130, markPaint(130)))
writeFileSync(join(dir, 'splashBackground.png'), png(1920, 1080, splashPaint))
console.log('icone e splash webOS scritti')
