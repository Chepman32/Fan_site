import { writeFile } from 'node:fs/promises'
import { deflateSync } from 'node:zlib'

const width = 1200
const height = 630
const pixels = Buffer.alloc(width * height * 4)

const font = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01111', '10000', '10000', '10111', '10001', '10001', '01110'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
  ' ': ['000', '000', '000', '000', '000', '000', '000'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '6': ['00111', '01000', '10000', '11110', '10001', '10001', '01110'],
  '&': ['01100', '10010', '10100', '01000', '10101', '10010', '01101'],
}

function setPixel(x, y, r, g, b, a = 255) {
  if (x < 0 || x >= width || y < 0 || y >= height) return
  const offset = (y * width + x) * 4
  pixels[offset] = r
  pixels[offset + 1] = g
  pixels[offset + 2] = b
  pixels[offset + 3] = a
}

function rect(x, y, w, h, color) {
  for (let yy = Math.max(0, y); yy < Math.min(height, y + h); yy += 1) {
    for (let xx = Math.max(0, x); xx < Math.min(width, x + w); xx += 1) {
      setPixel(xx, yy, ...color)
    }
  }
}

function blend(a, b, t) {
  return a.map((value, index) => Math.round(value + (b[index] - value) * t))
}

function drawText(text, x, y, scale, color, gap = scale) {
  let cursor = x
  for (const letter of text.toUpperCase()) {
    const glyph = font[letter] || font[' ']
    glyph.forEach((row, rowIndex) => {
      Array.from(row).forEach((cell, colIndex) => {
        if (cell === '1') rect(cursor + colIndex * scale, y + rowIndex * scale, scale, scale, color)
      })
    })
    cursor += glyph[0].length * scale + gap
  }
}

for (let y = 0; y < height; y += 1) {
  const vertical = y / (height - 1)
  for (let x = 0; x < width; x += 1) {
    const horizontal = x / (width - 1)
    const base = blend([10, 10, 15], [8, 35, 49], Math.min(1, horizontal * 0.75 + vertical * 0.35))
    const glow = Math.max(0, 1 - Math.hypot((x - 920) / 580, (y - 210) / 360))
    setPixel(
      x,
      y,
      Math.min(255, base[0] + Math.round(glow * 70)),
      Math.min(255, base[1] + Math.round(glow * 28)),
      Math.min(255, base[2] + Math.round(glow * 85)),
    )
  }
}

for (let x = 0; x < width; x += 48) rect(x, 0, 1, height, [255, 255, 255, 18])
for (let y = 0; y < height; y += 48) rect(0, y, width, 1, [255, 255, 255, 18])

rect(0, 440, width, 190, [16, 16, 26, 238])
rect(0, 452, width, 8, [255, 45, 149, 255])
rect(0, 460, width, 4, [0, 217, 255, 255])
rect(88, 88, 92, 92, [18, 18, 26, 255])
rect(100, 100, 68, 68, [134, 59, 255, 255])
rect(124, 112, 24, 44, [237, 230, 255, 220])
rect(108, 132, 52, 12, [0, 217, 255, 210])

drawText('LEONIDA LOOT', 88, 232, 16, [255, 255, 255, 255], 10)
drawText('GTA VI FAN HUB', 92, 332, 8, [242, 242, 255, 255], 7)
drawText('GUIDES NEWS SHOP P2P', 92, 390, 6, [185, 193, 217, 255], 5)
drawText('LEONIDALOOT.COM', 116, 500, 6, [255, 255, 255, 255], 5)
rect(88, 478, 380, 4, [255, 45, 149, 255])

function crc32(buffer) {
  let crc = -1
  for (const byte of buffer) {
    crc ^= byte
    for (let index = 0; index < 8; index += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
    }
  }
  return (crc ^ -1) >>> 0
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type)
  const length = Buffer.alloc(4)
  const crc = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])))
  return Buffer.concat([length, typeBuffer, data, crc])
}

const raw = Buffer.alloc((width * 4 + 1) * height)
for (let y = 0; y < height; y += 1) {
  const rowOffset = y * (width * 4 + 1)
  raw[rowOffset] = 0
  pixels.copy(raw, rowOffset + 1, y * width * 4, (y + 1) * width * 4)
}

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(width, 0)
ihdr.writeUInt32BE(height, 4)
ihdr[8] = 8
ihdr[9] = 6

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
])

await writeFile(new URL('../public/og-image.png', import.meta.url), png)
