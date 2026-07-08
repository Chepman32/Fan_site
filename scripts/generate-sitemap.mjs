import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')
const serverEntryPath = path.join(rootDir, 'dist-ssr', 'entry-server.js')

const {
  SITE_ORIGIN,
  indexableSeoRoutes,
} = await import(pathToFileURL(serverEntryPath).href)

function sitemapXml(routes) {
  const today = new Date().toISOString().slice(0, 10)
  const urls = routes.map((route) => {
    const pathName = route.path === '/' ? '/' : route.path

    return [
      '  <url>',
      `    <loc>${SITE_ORIGIN}${pathName}</loc>`,
      `    <lastmod>${today}</lastmod>`,
      `    <changefreq>${route.changefreq || 'monthly'}</changefreq>`,
      `    <priority>${Number(route.priority ?? 0.7).toFixed(1)}</priority>`,
      '  </url>',
    ].join('\n')
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

await mkdir(distDir, { recursive: true })
await writeFile(path.join(distDir, 'sitemap.xml'), sitemapXml(indexableSeoRoutes))

console.log(`Generated sitemap.xml with ${indexableSeoRoutes.length} routes.`)
