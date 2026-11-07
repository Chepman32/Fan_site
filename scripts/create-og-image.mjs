import { copyFile, readFile } from 'node:fs/promises'

// The artwork is generated with imagegen; see docs/social-preview.json.
// Keep this command as a compatibility export, never a pixel-font renderer.
const source = new URL('../public/og-image-sunshine.png', import.meta.url)
const legacy = new URL('../public/og-image.png', import.meta.url)
const image = await readFile(source)
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

if (
  image.length < 33
  || !image.subarray(0, 8).equals(pngSignature)
  || image.readUInt32BE(16) !== 1200
  || image.readUInt32BE(20) !== 630
) {
  throw new Error('The social preview must be a 1200×630 PNG.')
}

await copyFile(source, legacy)
console.log('Updated public/og-image.png from the sunny social preview.')
