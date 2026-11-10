import { build } from 'vite'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

// This is a one-time price snapshot, not a live USD/Stars exchange calculation.
// Existing fixed Stars prices survive subsequent catalog refreshes.
const output = new URL('../functions/shop-stars-catalog.json', import.meta.url)
const temporary = await mkdtemp(join(tmpdir(), 'leonida-stars-'))
try {
  await build({
    logLevel: 'error', build: {
      ssr: 'src/shop/shopData.js', outDir: temporary, emptyOutDir: true,
      rollupOptions: { output: { entryFileNames: 'catalog.mjs' } },
    },
  })
  const { SHOP_PRODUCT_BY_ID } = await import(pathToFileURL(join(temporary, 'catalog.mjs')).href)
  const previous = await readFile(output, 'utf8').then(JSON.parse).catch((error) => {
    if (error.code === 'ENOENT') return {}
    throw error
  })
  const catalog = Object.fromEntries(Object.values(SHOP_PRODUCT_BY_ID).map((product) => {
    if (!product.downloadUrl?.startsWith('https://drive.google.com/')) {
      throw new Error(`A supported download is required for ${product.id}.`)
    }
    const priceStars = previous[product.id]?.priceStars ?? Math.round(product.price * 100)
    if (!Number.isSafeInteger(priceStars) || priceStars < 1) throw new Error(`Invalid Stars price: ${product.id}`)
    return [product.id, { title: product.title, priceStars,
      downloadUrl: product.downloadUrl, downloadFileName: product.downloadFileName }]
  }))
  if (process.argv.includes('--write')) {
    await writeFile(output, `${JSON.stringify(catalog, null, 2)}\n`)
    console.log(`Saved ${Object.keys(catalog).length} fixed Stars prices. Existing prices were preserved.`)
  } else {
    if (JSON.stringify(previous) !== JSON.stringify(catalog)) throw new Error('Stars catalog differs. Review changes with npm run stars:catalog -- --write.')
    console.log(`Validated ${Object.keys(catalog).length} fixed Stars prices.`)
  }
} finally {
  await rm(temporary, { recursive: true, force: true })
}
