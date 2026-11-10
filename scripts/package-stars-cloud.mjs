import { copyFile, mkdir, rm } from 'node:fs/promises'

// Only these reviewed source files enter the deployment context. No env files,
// Firebase credentials, wallet keys, or unrelated Functions are packaged.
const output = new URL('../cloudrun/stars/generated/', import.meta.url)
await rm(output, { recursive: true, force: true })
await mkdir(output, { recursive: true })
for (const file of ['shop-stars.cjs', 'shop-stars-catalog.json', 'stars-runtime.cjs', 'stars-http.cjs']) {
  await copyFile(new URL(`../functions/${file}`, import.meta.url), new URL(file, output))
}
console.log('Packaged the Stars-only service for Cloud Run in fan-site-496610.')
